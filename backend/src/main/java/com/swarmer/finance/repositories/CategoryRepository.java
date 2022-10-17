package com.swarmer.finance.repositories;

import java.util.Collection;
import java.util.List;

import org.springframework.data.repository.CrudRepository;

import com.swarmer.finance.models.Category;

public interface CategoryRepository extends CrudRepository<Category, Long> {
    List<Category> findByOwnerIdIsNullOrOwnerIdIn(Collection<Long> ids);
}
