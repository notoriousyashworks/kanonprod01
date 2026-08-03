package com.kicksaura.orderservice.service;

import com.kicksaura.orderservice.client.ProductClient;
import com.kicksaura.orderservice.client.UserClient;
import com.kicksaura.orderservice.dto.*;
import com.kicksaura.orderservice.entity.Order;
import com.kicksaura.orderservice.entity.OrderItem;
import com.kicksaura.orderservice.exception.ResourceNotFoundException;
import com.kicksaura.orderservice.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final UserClient userClient;
    private final ProductClient productClient;
    private final EmailService emailService;

    @Transactional
    public OrderResponseDTO createCheckoutSession(CheckoutRequestDTO request) {
        // 1. Build flat GuestCheckoutDTO for user-service (it expects flat address fields, not nested)
        GuestCheckoutDTO guestDTO = GuestCheckoutDTO.builder()
                .phoneNumber(request.getPhoneNumber())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .houseNumberOrAddress(request.getShippingAddress() != null ? request.getShippingAddress().getHouseNumberOrAddress() : "")
                .landmark(request.getShippingAddress() != null ? request.getShippingAddress().getLandmark() : "")
                .city(request.getShippingAddress() != null ? request.getShippingAddress().getCity() : "")
                .state(request.getShippingAddress() != null ? request.getShippingAddress().getState() : "")
                .pinCode(request.getShippingAddress() != null ? request.getShippingAddress().getPinCode() : "")
                .build();

        UserDTO userDTO = userClient.guestCheckout(guestDTO);
        String userId = userDTO.getUuid();

        // 2. Build Order
        Order order = Order.builder()
                .orderNumber("ORD-" + System.currentTimeMillis())
                .userId(userId)
                .status("ORDER_PLACED")
                .paymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod().toUpperCase() : "COD")
                .phoneNumber(request.getPhoneNumber())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .shippingAddress(request.getShippingAddress())
                .build();

        double subtotal = 0.0;
        int totalUnits = 0;
        boolean orderHasLiveVideoCall = false;

        // Collect product details for the email notification (productId → ProductDTO)
        Map<String, ProductDTO> productMap = new HashMap<>();

        for (OrderItemRequestDTO itemRequest : request.getItems()) {
            // 3. Fetch product details
            ProductDTO product = productClient.getProductById(itemRequest.getProductId());
            productMap.put(itemRequest.getProductId().toString(), product);

            // Validate variant exists
            ProductDTO.VariantDTO variant = product.getVariants().stream()
                    .filter(v -> v.getId().equals(itemRequest.getVariantId()))
                    .findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("Variant not found in product"));

            double purchasePrice = product.getDiscountedPrice() != null
                    ? product.getDiscountedPrice()
                    : product.getBasePrice();
            subtotal += purchasePrice * itemRequest.getQuantity();
            totalUnits += itemRequest.getQuantity();

            OrderItem orderItem = OrderItem.builder()
                    .productId(itemRequest.getProductId())
                    .variantId(itemRequest.getVariantId())
                    .quantity(itemRequest.getQuantity())
                    .purchasePrice(purchasePrice)
                    .liveVideoCall(itemRequest.getLiveVideoCall() != null ? itemRequest.getLiveVideoCall() : false)
                    .build();

            if (Boolean.TRUE.equals(orderItem.getLiveVideoCall())) {
                orderHasLiveVideoCall = true;
            }
            order.addItem(orderItem);
        }
        order.setLiveVideoCall(orderHasLiveVideoCall);

        double discount = 0;
        double shipping = 0;
        if ("prepaid".equalsIgnoreCase(request.getPaymentMethod())) {
            discount = totalUnits * 200.0;
        } else if ("cod".equalsIgnoreCase(request.getPaymentMethod())) {
            shipping = totalUnits * 99.0;
        }

        order.setShippingFees(shipping);
        order.setTotalAmount(subtotal - discount + shipping);

        // 4. Save order
        Order savedOrder = orderRepository.save(order);

        // 5. Fire email notification asynchronously — does not block the HTTP response
        emailService.sendNewOrderNotification(savedOrder, request, productMap);
        log.info("Order {} created for user {}; email notification dispatched.", savedOrder.getOrderNumber(), userId);

        return mapToDTO(savedOrder);
    }

    @Transactional(readOnly = true)
    public OrderResponseDTO getOrderById(String id) {
        Order order = orderRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        return mapToDTO(order);
    }

    @Transactional
    public OrderResponseDTO updateOrderStatus(String id, String status, String adminStatus) {
        Order order = orderRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        if (status != null && !status.trim().isEmpty()) {
            order.setStatus(status);
        }
        if (adminStatus != null && !adminStatus.trim().isEmpty()) {
            order.setAdminStatus(adminStatus);
        }
        return mapToDTO(orderRepository.save(order));
    }
    @Transactional
    public OrderResponseDTO updateOrderAdmin(String id, AdminOrderUpdateRequest request) {
        Order order = orderRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (request.getPaymentMethod() != null) {
            order.setPaymentMethod(request.getPaymentMethod().toUpperCase());
        }
        if (request.getTrackingId() != null) {
            order.setTrackingId(request.getTrackingId());
        }
        if (request.getTrackingLink() != null) {
            order.setTrackingLink(request.getTrackingLink());
        }
        if (request.getShippingFees() != null) {
            order.setShippingFees(request.getShippingFees());
        }
        if (request.getPhoneNumber() != null) {
            order.setPhoneNumber(request.getPhoneNumber());
        }

        if (request.getItems() != null) {
            Map<String, AdminOrderUpdateRequest.ItemUpdateDTO> itemUpdates = request.getItems().stream()
                    .collect(Collectors.toMap(AdminOrderUpdateRequest.ItemUpdateDTO::getId, dto -> dto));

            for (OrderItem item : order.getItems()) {
                if (itemUpdates.containsKey(item.getId().toString())) {
                    AdminOrderUpdateRequest.ItemUpdateDTO update = itemUpdates.get(item.getId().toString());
                    if (update.getStatus() != null) {
                        item.setStatus(update.getStatus().toUpperCase());
                    }
                    if (update.getQuantity() != null && update.getQuantity() > 0) {
                        item.setQuantity(update.getQuantity());
                    }
                    if (update.getVariantId() != null && !update.getVariantId().isEmpty()) {
                        item.setVariantId(update.getVariantId());
                    }
                }
            }
        }

        // Recalculate total
        double subtotal = 0.0;
        int totalUnits = 0;

        for (OrderItem item : order.getItems()) {
            subtotal += item.getPurchasePrice() * item.getQuantity();
            totalUnits += item.getQuantity();
        }

        double discount = 0;
        
        if ("PREPAID".equalsIgnoreCase(order.getPaymentMethod())) {
            discount = totalUnits * 200.0;
        }

        double shipping = 0;
        if (order.getShippingFees() != null) {
            shipping = order.getShippingFees();
        } else {
            if ("COD".equalsIgnoreCase(order.getPaymentMethod())) {
                shipping = totalUnits * 99.0;
            }
        }

        order.setShippingFees(shipping);
        order.setTotalAmount(subtotal - discount + shipping);

        return mapToDTO(orderRepository.save(order));
    }
    @Transactional(readOnly = true)
    public List<OrderResponseDTO> getAllOrders() {
        return orderRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OrderResponseDTO> getOrdersByUserId(String userId) {
        return orderRepository.findAllByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public OrderStatsDTO getOrderStats() {
        List<Order> allOrders = orderRepository.findAll();
        long totalOrders = allOrders.size();
        long pendingOrders = allOrders.stream()
                .filter(o -> "ORDER_PLACED".equalsIgnoreCase(o.getStatus())
                          || "PENDING".equalsIgnoreCase(o.getStatus()))
                .count();
        double totalRevenue = allOrders.stream()
                .filter(o -> !"CANCELLED".equalsIgnoreCase(o.getStatus())
                          && !"RETURNED".equalsIgnoreCase(o.getStatus()))
                .mapToDouble(Order::getTotalAmount)
                .sum();
        long totalCustomers = orderRepository.countDistinctCustomers();

        return OrderStatsDTO.builder()
                .totalOrders(totalOrders)
                .pendingOrders(pendingOrders)
                .totalRevenue(totalRevenue)
                .totalCustomers(totalCustomers)
                .build();
    }
    // ─── Mapper ──────────────────────────────────────────────────────────────────

    private OrderResponseDTO mapToDTO(Order order) {
        List<OrderItemResponseDTO> items = order.getItems().stream()
                .map(item -> OrderItemResponseDTO.builder()
                        .id(item.getId().toString())
                        .productId(item.getProductId())
                        .variantId(item.getVariantId())
                        .quantity(item.getQuantity())
                        .purchasePrice(item.getPurchasePrice())
                        .status(item.getStatus())
                        .liveVideoCall(item.getLiveVideoCall() != null ? item.getLiveVideoCall() : false)
                        .build())
                .collect(Collectors.toList());

        return OrderResponseDTO.builder()
                .id(order.getId().toString())
                .orderNumber(order.getOrderNumber())
                .userId(order.getUserId())
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus())
                .adminStatus(order.getAdminStatus())
                .paymentMethod(order.getPaymentMethod())
                .trackingId(order.getTrackingId())
                .trackingLink(order.getTrackingLink())
                .phoneNumber(order.getPhoneNumber())
                .firstName(order.getFirstName())
                .lastName(order.getLastName())
                .shippingFees(order.getShippingFees())
                .shippingAddress(order.getShippingAddress())
                .liveVideoCall(order.getLiveVideoCall() != null ? order.getLiveVideoCall() : false)
                .items(items)
                .createdAt(order.getCreatedAt())
                .build();
    }
}
