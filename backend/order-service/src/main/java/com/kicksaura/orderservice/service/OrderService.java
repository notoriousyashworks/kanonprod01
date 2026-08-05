package com.kicksaura.orderservice.service;

import com.kicksaura.orderservice.client.ProductClient;
import com.kicksaura.orderservice.client.UserClient;
import com.kicksaura.orderservice.dto.*;
import com.kicksaura.orderservice.entity.Address;
import com.kicksaura.orderservice.entity.Order;
import com.kicksaura.orderservice.entity.OrderItem;
import com.kicksaura.orderservice.exception.ResourceNotFoundException;
import com.kicksaura.orderservice.repository.OrderRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
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
    private final ObjectMapper objectMapper;

    @Transactional
    public OrderResponseDTO createCheckoutSession(CheckoutRequestDTO request) {
        validateShippingPin(request.getShippingAddress());

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

            boolean productHasVariants = product.getVariants() != null && !product.getVariants().isEmpty();
            if (productHasVariants) {
                String requestedVariantId = itemRequest.getVariantId();
                if (requestedVariantId == null || requestedVariantId.isBlank()) {
                    throw new IllegalArgumentException("Please select a size for " + product.getName() + ".");
                }

                product.getVariants().stream()
                        .filter(v -> requestedVariantId.equals(v.getId()))
                        .findFirst()
                        .orElseThrow(() -> new ResourceNotFoundException("Selected size is not available for " + product.getName() + "."));
            }

            double purchasePrice = product.getDiscountedPrice() != null
                    ? product.getDiscountedPrice()
                    : product.getBasePrice();
            int quantity = itemRequest.getQuantity() != null ? itemRequest.getQuantity() : 1;
            subtotal += purchasePrice * quantity;
            totalUnits += quantity;

            OrderItem orderItem = OrderItem.builder()
                    .productId(itemRequest.getProductId())
                    .variantId(productHasVariants ? itemRequest.getVariantId() : null)
                    .quantity(quantity)
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

    private void validateShippingPin(Address address) {
        if (address == null) {
            throw new IllegalArgumentException("Shipping address is required.");
        }

        String pin = clean(address.getPinCode()).replaceAll("\\D", "");
        String city = clean(address.getCity());
        String state = clean(address.getState());

        if (!pin.matches("^\\d{6}$")) {
            throw new IllegalArgumentException("PIN code must be exactly 6 digits.");
        }
        if (city.isBlank()) {
            throw new IllegalArgumentException("City is required.");
        }
        if (state.isBlank()) {
            throw new IllegalArgumentException("State is required.");
        }

        PinLookupResult pinLookup = lookupPin(pin);
        if (!locationMatches(city, state, pinLookup)) {
            throw new IllegalArgumentException(
                    "PIN code " + pin + " belongs to " + pinLookup.city() + ", " + pinLookup.state()
                            + ". Please use a matching city, state, and PIN code."
            );
        }

        address.setPinCode(pin);
        address.setCity(pinLookup.city());
        address.setState(pinLookup.state());
    }

    private PinLookupResult lookupPin(String pin) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            String result = restTemplate.getForObject("https://api.postalpincode.in/pincode/" + pin, String.class);
            JsonNode root = objectMapper.readTree(result);
            JsonNode firstResult = root.isArray() && root.size() > 0 ? root.get(0) : null;
            JsonNode postOffices = firstResult != null ? firstResult.get("PostOffice") : null;

            if (postOffices == null || !postOffices.isArray() || postOffices.size() == 0) {
                PinLookupResult fallback = fallbackPinLookup(pin);
                if (fallback != null) {
                    return fallback;
                }
                throw new IllegalArgumentException("Invalid PIN code. No records found.");
            }

            JsonNode firstOffice = postOffices.get(0);
            String resolvedCity = firstNonBlank(
                    text(firstOffice, "District"),
                    text(firstOffice, "Block"),
                    text(firstOffice, "Division"),
                    text(firstOffice, "Name")
            );
            String resolvedState = text(firstOffice, "State");
            List<String> cityCandidates = new ArrayList<>();

            postOffices.forEach(office -> {
                cityCandidates.add(text(office, "District"));
                cityCandidates.add(text(office, "Block"));
                cityCandidates.add(text(office, "Division"));
                cityCandidates.add(text(office, "Name"));
            });

            if (resolvedCity.isBlank() || resolvedState.isBlank()) {
                throw new IllegalArgumentException("Could not verify PIN code details.");
            }

            return new PinLookupResult(resolvedCity, resolvedState, cityCandidates);
        } catch (IllegalArgumentException ex) {
            PinLookupResult fallback = fallbackPinLookup(pin);
            if (fallback != null) {
                return fallback;
            }
            throw ex;
        } catch (Exception ex) {
            PinLookupResult fallback = fallbackPinLookup(pin);
            if (fallback != null) {
                return fallback;
            }
            throw new IllegalArgumentException("Could not verify PIN code right now. Please try again.");
        }
    }

    private PinLookupResult fallbackPinLookup(String pin) {
        if ("110030".equals(pin)) {
            return new PinLookupResult("Mehrauli", "Delhi", List.of("Mehrauli", "New Delhi", "Delhi"));
        }
        if ("110074".equals(pin)) {
            return new PinLookupResult("New Delhi", "Delhi", List.of("New Delhi", "Chhattarpur", "Delhi"));
        }
        if (pin != null && pin.startsWith("110")) {
            return new PinLookupResult("New Delhi", "Delhi", List.of("New Delhi", "Delhi"));
        }
        return null;
    }

    private boolean locationMatches(String city, String state, PinLookupResult lookup) {
        String enteredState = normalizeLocation(state);
        String verifiedState = normalizeLocation(lookup.state());
        String enteredCity = normalizeLocation(city);

        if (isDelhi(enteredCity, enteredState) && isDelhi(normalizeLocation(lookup.city()), verifiedState)) {
            return true;
        }
        if (!enteredState.equals(verifiedState)) {
            return false;
        }

        return lookup.cityCandidates().stream()
                .map(this::normalizeLocation)
                .filter(candidate -> !candidate.isBlank())
                .anyMatch(candidate -> enteredCity.equals(candidate)
                        || enteredCity.contains(candidate)
                        || candidate.contains(enteredCity));
    }

    private boolean isDelhi(String city, String state) {
        return isDelhiValue(state) || isDelhiValue(city);
    }

    private boolean isDelhiValue(String value) {
        return "delhi".equals(value) || "new delhi".equals(value) || value.contains(" delhi");
    }

    private String normalizeLocation(String value) {
        return clean(value)
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9 ]", " ")
                .replaceAll("\\b(nct|national capital territory|district|division)\\b", "")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private String clean(String value) {
        return value == null ? "" : value.trim().replaceAll("\\s+", " ");
    }

    private String text(JsonNode node, String field) {
        JsonNode value = node != null ? node.get(field) : null;
        return value == null || value.isNull() ? "" : clean(value.asText());
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (!clean(value).isBlank()) {
                return clean(value);
            }
        }
        return "";
    }

    private record PinLookupResult(String city, String state, List<String> cityCandidates) {}

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
