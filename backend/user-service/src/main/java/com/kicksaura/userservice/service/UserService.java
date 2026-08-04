package com.kicksaura.userservice.service;

import com.kicksaura.userservice.dto.AdminUserDTO;
import com.kicksaura.userservice.dto.GuestCheckoutRequest;
import com.kicksaura.userservice.entity.Address;
import com.kicksaura.userservice.entity.User;
import com.kicksaura.userservice.exception.ResourceNotFoundException;
import com.kicksaura.userservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private static final int MAX_SAVED_ADDRESSES = 3;
    private static final String ADDRESS_LIMIT_MESSAGE =
            "Max address limit reached. Delete one address first to add a new address.";

    private final UserRepository userRepository;

    /**
     * Finds an existing user by normalized 10-digit phone number, or creates a new
     * ROLE_CUSTOMER user. Protected against duplicate creation by the DB unique constraint.
     */
    @Transactional
    public User findOrCreateByPhone(String normalizedPhone) {
        User user = userRepository.findByPhoneNumber(normalizedPhone).orElseGet(() -> {
            User newUser = User.builder()
                    .phoneNumber(normalizedPhone)
                    .firstName("Your Profile")
                    .lastName(null)
                    .role("ROLE_CUSTOMER")
                    .build();
            return userRepository.save(newUser);
        });

        // Update legacy default names or blank names
        if (user.getFirstName() == null || user.getFirstName().trim().isEmpty() || "User".equalsIgnoreCase(user.getFirstName().trim())) {
            user.setFirstName("Your Profile");
            userRepository.save(user);
        }

        return user;
    }
    @Transactional
    public User getOrCreateGuestUser(GuestCheckoutRequest request) {
        Optional<User> existingUserOpt = userRepository.findByPhoneNumber(request.getPhoneNumber());

        Address newAddress = Address.builder()
                .firstName(clean(request.getFirstName()))
                .lastName(clean(request.getLastName()))
                .houseNumberOrAddress(request.getHouseNumberOrAddress())
                .landmark(request.getLandmark())
                .city(request.getCity())
                .state(request.getState())
                .pinCode(request.getPinCode())
                .build();

        if (existingUserOpt.isPresent()) {
            User existingUser = existingUserOpt.get();
            existingUser.setFirstName(clean(request.getFirstName()));
            existingUser.setLastName(clean(request.getLastName()));
            
            boolean exists = existingUser.getAddresses().stream().anyMatch(a ->
                    a.getPinCode() != null && a.getPinCode().equals(newAddress.getPinCode()) &&
                    a.getHouseNumberOrAddress() != null && a.getHouseNumberOrAddress().equals(newAddress.getHouseNumberOrAddress())
            );
            
            trimSavedAddresses(existingUser);

            if (!exists) {
                if (existingUser.getAddresses().size() >= MAX_SAVED_ADDRESSES) {
                    throw new IllegalArgumentException(ADDRESS_LIMIT_MESSAGE);
                }
                existingUser.getAddresses().add(newAddress);
            }
            
            return userRepository.save(existingUser);
        }

        User newUser = User.builder()
                .phoneNumber(request.getPhoneNumber())
                .firstName(clean(request.getFirstName()))
                .lastName(clean(request.getLastName()))
                .role("ROLE_GUEST")
                .build();
        newUser.getAddresses().add(newAddress);

        return userRepository.save(newUser);
    }

    public List<AdminUserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToAdminDTO)
                .collect(Collectors.toList());
    }

    public AdminUserDTO getUserByUuid(String uuid) {
        User user = userRepository.findByUuid(uuid)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with uuid: " + uuid));
        return mapToAdminDTO(user);
    }

    private AdminUserDTO mapToAdminDTO(User user) {
        return AdminUserDTO.builder()
                .uuid(user.getUuid())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phoneNumber(user.getPhoneNumber())
                .email(user.getEmail())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private void trimSavedAddresses(User user) {
        if (user.getAddresses().size() > MAX_SAVED_ADDRESSES) {
            user.getAddresses().subList(MAX_SAVED_ADDRESSES, user.getAddresses().size()).clear();
        }
    }

    private String clean(String value) {
        return value == null ? "" : value.trim().replaceAll("\\s+", " ");
    }
}
