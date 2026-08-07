package com.kicksaura.orderservice.client;

import com.kicksaura.orderservice.dto.GuestCheckoutDTO;
import com.kicksaura.orderservice.dto.UserDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "user-service", url = "${user-service.url:http://user-service:8081}")
public interface UserClient {

    @PostMapping("/api/v1/internal/users/guest-checkout")
    UserDTO guestCheckout(@RequestBody GuestCheckoutDTO request);
}
