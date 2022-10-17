package com.swarmer.finance.repositories;

import java.util.Collection;
import java.util.List;

import org.springframework.data.repository.CrudRepository;

import com.swarmer.finance.models.AccountGroup;

public interface GroupRepository extends CrudRepository<AccountGroup, Long> {
    List<AccountGroup> findByOwnerIdInOrderById(Collection<Long> ids);
}
