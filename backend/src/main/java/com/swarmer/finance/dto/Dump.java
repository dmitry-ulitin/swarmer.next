package com.swarmer.finance.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

public record Dump(
        @JsonProperty("owner_id") Long ownerId,
        LocalDateTime created,
        List<DumpGroup> groups,
        List<DumpCategory> categories,
        List<DumpTransaction> transactions) {
}
