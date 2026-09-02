package com.kicksaura.productservice.service;

import com.kicksaura.productservice.config.BunnyStorageConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class BunnyStorageService {

    private final BunnyStorageConfig bunnyConfig;

    public String uploadFile(MultipartFile file, String folder) throws Exception {
        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "upload";
        String extension = "";
        int i = originalFilename.lastIndexOf('.');
        if (i > 0) {
            extension = originalFilename.substring(i);
        }
        
        String cleanName = originalFilename.replaceAll("[^a-zA-Z0-9.-]", "_");
        String finalFilename = UUID.randomUUID().toString().substring(0, 8) + "-" + System.currentTimeMillis() + "-" + cleanName;
        
        String uploadPath = (folder != null && !folder.isEmpty()) ? folder + "/" + finalFilename : finalFilename;
        String uploadUrl = "https://" + bunnyConfig.getHost() + "/" + bunnyConfig.getZone() + "/" + uploadPath;

        log.info("Uploading file to Bunny Storage: {}", uploadUrl);
        URL url = new URL(uploadUrl);
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setRequestMethod("PUT");
        connection.setRequestProperty("AccessKey", bunnyConfig.getApiKey());
        connection.setRequestProperty("Content-Type", file.getContentType() != null ? file.getContentType() : "application/octet-stream");
        connection.setDoOutput(true);

        try (InputStream inputStream = file.getInputStream();
             java.io.OutputStream outputStream = connection.getOutputStream()) {
            
            byte[] buffer = new byte[8192];
            int bytesRead;
            while ((bytesRead = inputStream.read(buffer)) != -1) {
                outputStream.write(buffer, 0, bytesRead);
            }
        }

        int responseCode = connection.getResponseCode();
        if (responseCode >= 200 && responseCode < 300) {
            String cdnUrl = bunnyConfig.getCdnBaseUrl() + "/" + uploadPath;
            log.info("Upload successful: {}", cdnUrl);
            return cdnUrl;
        } else {
            log.error("Upload failed with HTTP {}: {}", responseCode, connection.getResponseMessage());
            throw new RuntimeException("Bunny Storage upload failed: HTTP " + responseCode);
        }
    }
}
