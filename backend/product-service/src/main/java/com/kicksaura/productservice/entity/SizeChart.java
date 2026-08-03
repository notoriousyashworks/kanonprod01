package com.kicksaura.productservice.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "size_charts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SizeChart {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne
    @JoinColumn(name = "brand_id", nullable = false, unique = true)
    private Brand brand;

    @Column(name = "image_url", nullable = false)
    private String imageUrl;
}
