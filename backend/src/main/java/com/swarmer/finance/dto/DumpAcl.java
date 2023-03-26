package com.swarmer.finance.dto;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.swarmer.finance.models.Acl;

public record DumpAcl(
        @JsonProperty("user_id") Long userId,
        Boolean admin,
        Boolean readonly,
        String name,
        Boolean deleted,
        LocalDateTime created,
        LocalDateTime updated) {
    public static DumpAcl from(Acl acl) {
        return new DumpAcl(
                acl.getUser().getId(),
                acl.getAdmin(),
                acl.getReadonly(),
                acl.getName(),
                acl.getDeleted(),
                acl.getCreated(),
                acl.getUpdated()
        );
    }
}
