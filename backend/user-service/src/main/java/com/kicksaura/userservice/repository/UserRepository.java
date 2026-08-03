package com.kicksaura.userservice.repository;

import com.kicksaura.userservice.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByUuid(String uuid);
    
    Optional<User> findByPhoneNumber(String phoneNumber);
}
