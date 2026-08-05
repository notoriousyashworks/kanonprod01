package com.kicksaura.orderservice.service;

import com.kicksaura.orderservice.dto.CheckoutRequestDTO;
import com.kicksaura.orderservice.dto.ProductDTO;
import com.kicksaura.orderservice.entity.Order;
import com.kicksaura.orderservice.entity.OrderItem;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

/**
 * Sends a rich HTML order notification email to the store owner
 * whenever a new order is placed.
 * All methods are @Async so they never block the HTTP response thread.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${notification.email.recipient:kicksauraa@gmail.com}")
    private String recipientEmail;

    @Value("${notification.email.sender-name:KicksAura Orders}")
    private String senderName;

    @Value("${spring.mail.username:kicksauraa@gmail.com}")
    private String senderEmail;

    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a").withZone(ZoneId.of("Asia/Kolkata"));

    // ─── Public API ──────────────────────────────────────────────────────────────

    /**
     * Sends a new order notification email to the store owner.
     *
     * @param order    the persisted order entity
     * @param request  the original checkout request (contains customer name/phone/address)
     * @param products map of productId → ProductDTO (fetched during order creation)
     */
    @Async("emailTaskExecutor")
    public void sendNewOrderNotification(Order order,
                                         CheckoutRequestDTO request,
                                         Map<String, ProductDTO> products) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(senderEmail, senderName);
            helper.setTo(recipientEmail);
            helper.setSubject("🛒 New Order: " + order.getOrderNumber()
                    + " — Rs " + String.format("%.0f", order.getTotalAmount()));

            helper.setText(buildHtml(order, request, products), true);

            mailSender.send(message);
            log.info("Order notification email sent for order: {}", order.getOrderNumber());

        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            // Email failures must never break the order flow
            log.error("Failed to send order notification email for order {}: {}",
                    order.getOrderNumber(), e.getMessage(), e);
        }
    }

    // ─── HTML Builder ─────────────────────────────────────────────────────────

    private String buildHtml(Order order,
                              CheckoutRequestDTO request,
                              Map<String, ProductDTO> products) {

        StringBuilder sb = new StringBuilder();

        // ── Document head ────────────────────────────────────────────────────
        sb.append("<!DOCTYPE html>")
          .append("<html lang='en'><head>")
          .append("<meta charset='UTF-8'>")
          .append("<meta name='viewport' content='width=device-width,initial-scale=1'>")
          .append("<title>New Order – KicksAura</title>")
          .append("</head>")
          .append("<body style='margin:0;padding:0;background:#f4f4f4;font-family:Inter,Helvetica Neue,Arial,sans-serif;'>");

        // ── Outer wrapper ────────────────────────────────────────────────────
        sb.append("<table width='100%' cellpadding='0' cellspacing='0' border='0' bgcolor='#f4f4f4'>")
          .append("<tr><td align='center' style='padding:32px 16px;'>");

        // ── Card ─────────────────────────────────────────────────────────────
        sb.append("<table width='620' cellpadding='0' cellspacing='0' border='0' ")
          .append("style='max-width:620px;width:100%;background:#ffffff;border-radius:12px;")
          .append("overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.09);'>");

        // ── Red header band ──────────────────────────────────────────────────
        sb.append("<tr><td align='center' bgcolor='#C82333' style='padding:32px 40px 28px;'>")
          .append("<h1 style='margin:0;color:#ffffff;font-size:26px;font-weight:900;letter-spacing:-0.5px;'>")
          .append("KicksAura</h1>")
          .append("<p style='margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:13px;'>")
          .append("Order Management Notification</p>")
          .append("</td></tr>");

        // ── "New order" badge ────────────────────────────────────────────────
        sb.append("<tr><td align='center' style='padding:28px 40px 0;'>")
          .append("<span style='display:inline-block;background:#fef2f2;color:#c82333;")
          .append("border:1px solid #fca5a5;border-radius:100px;padding:6px 18px;")
          .append("font-size:13px;font-weight:700;letter-spacing:0.3px;'>")
          .append("🛒 NEW ORDER PLACED</span>")
          .append("</td></tr>");

        // ── Order meta ───────────────────────────────────────────────────────
        sb.append("<tr><td style='padding:24px 40px 0;'>")
          .append("<table width='100%' cellpadding='0' cellspacing='0' border='0'>")
          .append("<tr>")
          .append(metaCell("Order Number", order.getOrderNumber()))
          .append(metaCell("Date", order.getCreatedAt() != null
                  ? order.getCreatedAt().format(DATE_FMT) : "—"))
          .append("</tr>")
          .append("<tr style='height:12px;'></tr>")
          .append("<tr>")
          .append(metaCell("Customer", String.join(" ",
                  java.util.stream.Stream.of(request.getFirstName(), request.getLastName())
                          .filter(v -> v != null && !v.isBlank())
                          .collect(java.util.stream.Collectors.toList()))))
          .append(metaCell("Phone", request.getPhoneNumber()))
          .append("</tr>")
          .append("<tr style='height:12px;'></tr>")
          .append("<tr>")
          .append(metaCell("Payment Method", request.getPaymentMethod() != null ? request.getPaymentMethod().toUpperCase() : "N/A"))
          .append(metaCell("", ""))
          .append("</tr>")
          .append("</table>")
          .append("</td></tr>");

        // ── Shipping address ─────────────────────────────────────────────────
        if (request.getShippingAddress() != null) {
            var addr = request.getShippingAddress();
            String addrLine = buildAddressLine(
                    addr.getHouseNumberOrAddress(), addr.getLandmark(),
                    addr.getCity(), addr.getState(), addr.getPinCode());

            sb.append("<tr><td style='padding:20px 40px 0;'>")
              .append("<p style='margin:0 0 6px;font-size:11px;font-weight:700;color:#999;")
              .append("text-transform:uppercase;letter-spacing:0.8px;'>Shipping Address</p>")
              .append("<p style='margin:0;font-size:14px;color:#333;line-height:1.6;'>")
              .append(escHtml(addrLine))
              .append("</p></td></tr>");
        }

        // ── Divider ──────────────────────────────────────────────────────────
        sb.append("<tr><td style='padding:24px 40px 0;'>")
          .append("<hr style='border:none;border-top:1px solid #eeeeee;margin:0;'>")
          .append("</td></tr>");

        // ── Section title: Items ─────────────────────────────────────────────
        sb.append("<tr><td style='padding:20px 40px 8px;'>")
          .append("<p style='margin:0;font-size:15px;font-weight:700;color:#111;'>")
          .append("Order Items</p>")
          .append("</td></tr>");

        // ── Product rows ─────────────────────────────────────────────────────
        for (OrderItem item : order.getItems()) {
            ProductDTO product = products.get(item.getProductId().toString());
            String productName  = product != null && product.getName()  != null ? product.getName()  : "Product";
            String productBrand = product != null && product.getBrand() != null ? product.getBrand() : "";
            String imageUrl     = getFirstImageUrl(product);
            String size         = resolveSize(product, item);

            sb.append("<tr><td style='padding:12px 40px;'>")
              .append("<table width='100%' cellpadding='0' cellspacing='0' border='0' ")
              .append("style='background:#fafafa;border:1px solid #eeeeee;border-radius:8px;'>")
              .append("<tr>");

            // Product image cell
            sb.append("<td width='80' style='padding:12px;vertical-align:middle;'>");
            if (imageUrl != null && !imageUrl.isBlank()) {
                sb.append("<img src='").append(escHtml(imageUrl)).append("' ")
                  .append("width='64' height='64' alt='").append(escHtml(productName)).append("' ")
                  .append("style='border-radius:6px;object-fit:cover;display:block;")
                  .append("border:1px solid #e8e8e8;background:#fff;'>");
            } else {
                // Placeholder box when no image
                sb.append("<div style='width:64px;height:64px;background:#f0f0f0;border-radius:6px;")
                  .append("display:flex;align-items:center;justify-content:center;")
                  .append("font-size:24px;'>👟</div>");
            }
            sb.append("</td>");

            // Product details cell
            sb.append("<td style='padding:12px 12px 12px 4px;vertical-align:middle;'>")
              .append("<p style='margin:0 0 2px;font-size:14px;font-weight:700;color:#111;'>")
              .append(escHtml(productName)).append("</p>");
            if (!productBrand.isBlank()) {
                sb.append("<p style='margin:0 0 4px;font-size:12px;color:#777;'>")
                  .append(escHtml(productBrand)).append("</p>");
            }
            if (!size.isBlank()) {
                sb.append("<p style='margin:0;font-size:12px;color:#555;'>")
                  .append("Size: ").append(escHtml(size)).append("</p>");
            }
            sb.append("</td>");

            // Qty × Price cell
            sb.append("<td style='padding:12px;vertical-align:middle;text-align:right;white-space:nowrap;'>")
              .append("<p style='margin:0 0 4px;font-size:12px;color:#777;'>")
              .append("Qty: ").append(item.getQuantity()).append("</p>")
              .append("<p style='margin:0;font-size:15px;font-weight:700;color:#111;'>")
              .append("Rs ").append(String.format("%.0f", item.getPurchasePrice() * item.getQuantity()))
              .append("</p>")
              .append("<p style='margin:2px 0 0;font-size:11px;color:#aaa;'>")
              .append("@ Rs ").append(String.format("%.0f", item.getPurchasePrice())).append(" each")
              .append("</p>")
              .append("</td>");

            sb.append("</tr></table></td></tr>");
        }

        // ── Divider ──────────────────────────────────────────────────────────
        sb.append("<tr><td style='padding:8px 40px 0;'>")
          .append("<hr style='border:none;border-top:1px solid #eeeeee;margin:0;'>")
          .append("</td></tr>");

        // ── Total row ────────────────────────────────────────────────────────
        sb.append("<tr><td style='padding:20px 40px;'>")
          .append("<table width='100%' cellpadding='0' cellspacing='0' border='0'>")
          .append("<tr>")
          .append("<td style='font-size:16px;font-weight:700;color:#111;'>Order Total</td>")
          .append("<td align='right' style='font-size:22px;font-weight:900;color:#c82333;'>")
          .append("Rs ").append(String.format("%.0f", order.getTotalAmount()))
          .append("</td>")
          .append("</tr>")
          .append("</table></td></tr>");

        // ── WhatsApp reminder ─────────────────────────────────────────────────
        sb.append("<tr><td align='center' style='padding:0 40px 32px;'>")
          .append("<div style='background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;")
          .append("padding:14px 20px;'>")
          .append("<p style='margin:0;font-size:13px;font-weight:600;color:#166534;'>")
          .append("📱 Remember to WhatsApp the customer within 15 minutes to confirm the order.</p>")
          .append("</div></td></tr>");

        // ── Footer ───────────────────────────────────────────────────────────
        sb.append("<tr><td align='center' bgcolor='#111111' style='padding:24px 40px;border-radius:0 0 12px 12px;'>")
          .append("<p style='margin:0;color:#888;font-size:12px;'>")
          .append("KicksAura · This is an automated order notification · Do not reply to this email</p>")
          .append("</td></tr>");

        // ── Close card, wrapper ───────────────────────────────────────────────
        sb.append("</table>"); // card
        sb.append("</td></tr></table>"); // outer wrapper
        sb.append("</body></html>");

        return sb.toString();
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /** Renders a two-column meta cell (label + value). */
    private String metaCell(String label, String value) {
        return "<td style='width:50%;vertical-align:top;'>"
                + "<p style='margin:0 0 2px;font-size:11px;font-weight:700;color:#999;"
                + "text-transform:uppercase;letter-spacing:0.8px;'>" + escHtml(label) + "</p>"
                + "<p style='margin:0;font-size:14px;font-weight:600;color:#111;'>"
                + escHtml(value != null ? value : "—") + "</p>"
                + "</td>";
    }

    /** Returns the first non-blank image URL from a ProductDTO, or null. */
    private String getFirstImageUrl(ProductDTO product) {
        if (product == null || product.getImageUrls() == null) return null;
        return product.getImageUrls().stream()
                .filter(url -> url != null && !url.isBlank())
                .findFirst()
                .orElse(null);
    }

    /** Resolves size from the variant list on the product. */
    private String resolveSize(ProductDTO product, OrderItem item) {
        if (product == null || product.getVariants() == null || item.getVariantId() == null) return "";
        return product.getVariants().stream()
                .filter(v -> item.getVariantId().equals(v.getId()))
                .map(v -> v.getSize() != null ? v.getSize() : "")
                .findFirst()
                .orElse("");
    }

    /** Builds a readable single-line address string. */
    private String buildAddressLine(String... parts) {
        StringBuilder sb = new StringBuilder();
        for (String part : parts) {
            if (part != null && !part.isBlank()) {
                if (sb.length() > 0) sb.append(", ");
                sb.append(part.strip());
            }
        }
        return sb.toString();
    }

    /** Minimal HTML escaping to prevent XSS in dynamic content. */
    private String escHtml(String input) {
        if (input == null) return "";
        return input.replace("&", "&amp;")
                    .replace("<", "&lt;")
                    .replace(">", "&gt;")
                    .replace("\"", "&quot;")
                    .replace("'", "&#x27;");
    }
}
