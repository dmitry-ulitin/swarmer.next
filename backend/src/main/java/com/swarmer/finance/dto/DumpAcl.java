package com.swarmer.finance.dto;

import java.time.LocalDateTime;

import com.swarmer.finance.models.Acl;

public record DumpAcl(
        Boolean admin,
        Boolean deleted,
        LocalDateTime created,
        LocalDateTime updated) {
    public static DumpAcl from(Acl acl) {
        return new DumpAcl(
                acl.getAdmin(),
                acl.getDeleted(),
                acl.getCreated(),
                acl.getUpdated()
        );
    }
}
