package com.swarmer.finance.repositories;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

import org.springframework.data.repository.CrudRepository;

import com.swarmer.finance.models.Category;

public interface CategoryRepository extends CrudRepository<Category, Long> {
    List<Category> findByOwnerIdIsNullOrOwnerIdIn(Collection<Long> ids);
    Stream<Category> findAllByOwnerId(Long userId);
    Optional<Category> findByOwnerIdAndParentIdAndNameIgnoreCase(Long ownerId, Long parentId, String name);
}
