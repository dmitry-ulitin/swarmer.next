package com.swarmer.finance.dto;

import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.swarmer.finance.models.AccountGroup;

public record GroupDto(
		Long id,
		@JsonProperty("owner_id") Long ownerId,
		String ownerEmail,
		String fullname,
		@JsonProperty("is_owner") Boolean owner,
		@JsonProperty("is_coowner") Boolean coowner,
		@JsonProperty("is_shared") Boolean shared,
		List<AccountDto> accounts,
		List<Permission> permissions,
		Boolean deleted) {
	public static GroupDto from(AccountGroup group, Long userId, Map<Long, Double> balances) {
		var owner = group.getOwner().getId().equals(userId)
				&& group.getAcls().stream().noneMatch(acl -> acl.getAdmin());
		var coowner = group.getAcls().stream().anyMatch(acl -> acl.getAdmin()
				&& (group.getOwner().getId().equals(userId) || acl.getUser().getId().equals(userId)));
		var shared = !group.getOwner().getId().equals(userId)
				&& group.getAcls().stream().noneMatch(acl -> acl.getAdmin());
		var fullname = group.getName();
		if (shared) {
			var acl = group.getAcls().stream().filter(a -> a.getUserId().equals(userId)).findFirst().orElse(null);
			fullname = acl != null && acl.getName() != null ? acl.getName()
					: (group.getName() + " (" + group.getOwner().getName() + ")");
		}
		var permissions = group.getAcls().stream().map(acl -> Permission.from(acl))
				.collect(java.util.stream.Collectors.toList());
		var accounts = group.getAccounts().stream()
				.map(account -> AccountDto.from(account, userId,
						account.getStart_balance() + balances.getOrDefault(account.getId(), .0)))
				.collect(java.util.stream.Collectors.toList());
		return new GroupDto(
				group.getId(),
				group.getOwner().getId(),
				group.getOwner().getEmail(),
				fullname,
				owner,
				coowner,
				shared,
				accounts,
				permissions,
				group.getDeleted());
	}
}
