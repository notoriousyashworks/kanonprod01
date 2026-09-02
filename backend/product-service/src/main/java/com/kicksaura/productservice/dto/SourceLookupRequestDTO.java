package com.kicksaura.productservice.dto;

import lombok.Data;
import java.util.List;

@Data
public class SourceLookupRequestDTO {
    private String sourceSite;
    private List<String> sourceProductIds;
}
