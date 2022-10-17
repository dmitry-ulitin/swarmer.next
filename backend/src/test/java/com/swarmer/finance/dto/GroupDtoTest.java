package com.swarmer.finance.dto;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;
import org.junit.jupiter.api.Test;

import com.swarmer.finance.models.Account;
import com.swarmer.finance.models.AccountGroup;
import com.swarmer.finance.models.Acl;
import com.swarmer.finance.models.User;

public class GroupDtoTest {
    @Test
    void testFromOwnerOneAccount() {
        var user1 = User.builder().id(1L).name("User1").build();
        var user2 = User.builder().id(2L).name("User2").build();
        var group = AccountGroup.builder().id(1L).owner(user1).name("Bank").build();
        var account1 = Account.builder().id(1L).group(group).currency("EUR").name("").start_balance(.0).build();
        group.setAccounts(List.of(account1));
        group.setAcls(List.of(Acl.builder().groupId(group.getId()).group(group).userId(user2.getId()).user(user2).admin(false).build()));

        var dto = GroupDto.from(group, 1L, Map.of());
        assertThat(dto.fullname()).isEqualTo("Bank");
        assertThat(dto.accounts().get(0).fullname()).isEqualTo("Bank");
    }

    @Test
    void testFromOwner() {
        var user1 = User.builder().id(1L).name("User1").build();
        var user2 = User.builder().id(2L).name("User2").build();
        var group = AccountGroup.builder().id(1L).owner(user1).name("Bank").build();
        var account1 = Account.builder().id(1L).group(group).currency("EUR").name("").start_balance(.0).build();
        var account2 = Account.builder().id(2L).group(group).currency("USD").name("account2").start_balance(.0).build();
        group.setAccounts(List.of(account1, account2));
        group.setAcls(List.of(Acl.builder().groupId(group.getId()).group(group).userId(user2.getId()).user(user2).admin(false).build()));

        var dto = GroupDto.from(group, 1L, Map.of());
        assertThat(dto.fullname()).isEqualTo("Bank");
        assertThat(dto.accounts().get(0).fullname()).isEqualTo("Bank EUR");
        assertThat(dto.accounts().get(1).fullname()).isEqualTo("Bank account2");
    }

    @Test
    void testFromSharedAdmin() {
        var user1 = User.builder().id(1L).name("User1").build();
        var user2 = User.builder().id(2L).name("User2").build();
        var group = AccountGroup.builder().id(1L).owner(user1).name("Bank").build();
        var account1 = Account.builder().id(1L).group(group).currency("EUR").name("").start_balance(.0).build();
        var account2 = Account.builder().id(2L).group(group).currency("USD").name("account2").start_balance(.0).build();
        group.setAccounts(List.of(account1, account2));
        group.setAcls(List.of(Acl.builder().groupId(group.getId()).group(group).userId(user2.getId()).user(user2).admin(true).build()));

        var dto = GroupDto.from(group, 2L, Map.of());
        assertThat(dto.fullname()).isEqualTo("Bank");
        assertThat(dto.accounts().get(0).fullname()).isEqualTo("Bank EUR");
        assertThat(dto.accounts().get(1).fullname()).isEqualTo("Bank account2");
    }

    @Test
    void testFromShared() {
        var user1 = User.builder().id(1L).name("User1").build();
        var user2 = User.builder().id(2L).name("User2").build();
        var group = AccountGroup.builder().id(1L).owner(user1).name("Bank").build();
        var account1 = Account.builder().id(1L).group(group).currency("EUR").name("").start_balance(.0).build();
        var account2 = Account.builder().id(2L).group(group).currency("USD").name("account2").start_balance(.0).build();
        group.setAccounts(List.of(account1, account2));
        group.setAcls(List.of(Acl.builder().groupId(group.getId()).group(group).userId(user2.getId()).user(user2).admin(false).build()));

        var dto = GroupDto.from(group, 2L, Map.of());
        assertThat(dto.fullname()).isEqualTo("Bank (User1)");
        assertThat(dto.accounts().get(0).fullname()).isEqualTo("Bank EUR (User1)");
        assertThat(dto.accounts().get(1).fullname()).isEqualTo("Bank account2 (User1)");
    }
}
