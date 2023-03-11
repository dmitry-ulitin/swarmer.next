package com.swarmer.finance.repositories;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;

import com.swarmer.finance.models.Category;

public interface CategoryRepository extends CrudRepository<Category, Long> {
    List<Category> findByOwnerIdIsNullOrOwnerIdInOrderById(Collection<Long> ids);
    Optional<Category> findByOwnerIdAndParentIdAndNameIgnoreCase(Long ownerId, Long parentId, String name);

    @Modifying
    @Query("insert into categories (id, ownerId, parentId, name, created, updated) values (?1, ?2, ?3, ?4, ?5, ?6)")
    void insertCategoryWithId(Long id, Long ownerId, Long parentId, String name, LocalDateTime created, LocalDateTime updated);
}
