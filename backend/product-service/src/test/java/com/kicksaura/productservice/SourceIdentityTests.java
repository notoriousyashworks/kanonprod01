package com.kicksaura.productservice;

import com.kicksaura.productservice.entity.Product;
import com.kicksaura.productservice.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class SourceIdentityTests {

    @Autowired
    private ProductRepository productRepository;

    private Product createValidProduct(String site, String sourceId) {
        return Product.builder()
                .name("Test Belt")
                .brand("Test")
                .category("Belts")
                .basePrice(100.0)
                .sourceSite(site)
                .sourceProductId(sourceId)
                .build();
    }

    @Test
    public void testSourceIdentityPersistence() {
        productRepository.saveAndFlush(createValidProduct("indiankicks.in", "ik-12345"));
        List<String> existing = productRepository.findExistingSourceProductIds("indiankicks.in", List.of("ik-12345", "non-existent"));
        assertEquals(1, existing.size());
        assertTrue(existing.contains("ik-12345"));
    }

    @Test
    public void testDuplicateSourceIdentityThrowsException() {
        productRepository.saveAndFlush(createValidProduct("indiankicks.in", "ik-dup"));
        assertThrows(DataIntegrityViolationException.class, () -> {
            productRepository.saveAndFlush(createValidProduct("indiankicks.in", "ik-dup"));
        });
    }

    @Test
    public void testDifferentSiteSameIdAllowed() {
        productRepository.saveAndFlush(createValidProduct("indiankicks.in", "ik-diff"));
        assertDoesNotThrow(() -> {
            productRepository.saveAndFlush(createValidProduct("othersite.com", "ik-diff"));
        });
    }

    @Test
    public void testSameSiteDifferentIdAllowed() {
        productRepository.saveAndFlush(createValidProduct("indiankicks.in", "ik-diff1"));
        assertDoesNotThrow(() -> {
            productRepository.saveAndFlush(createValidProduct("indiankicks.in", "ik-diff2"));
        });
    }

    @Test
    public void testBatchLookupFindsMultiple() {
        productRepository.saveAndFlush(createValidProduct("indiankicks.in", "batch1"));
        productRepository.saveAndFlush(createValidProduct("indiankicks.in", "batch2"));
        
        List<String> existing = productRepository.findExistingSourceProductIds("indiankicks.in", List.of("batch1", "batch2", "batch3"));
        assertEquals(2, existing.size());
        assertTrue(existing.contains("batch1"));
        assertTrue(existing.contains("batch2"));
    }

    @Test
    public void testBatchLookupEmpty() {
        List<String> existing = productRepository.findExistingSourceProductIds("indiankicks.in", List.of("not-found1", "not-found2"));
        assertTrue(existing.isEmpty());
    }

    @Test
    public void testNullSourceIdentityAllowed() {
        Product p = createValidProduct(null, null);
        assertDoesNotThrow(() -> productRepository.saveAndFlush(p));
    }
}
