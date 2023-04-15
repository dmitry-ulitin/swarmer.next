package com.swarmer.finance.repositories;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;

import com.swarmer.finance.models.Category;

public interface CategoryRepository extends CrudRepository<Category, Long> {
    List<Category> findByOwnerIdIsNullOrOwnerIdInOrderById(Collection<Long> ids);

    List<Category> findAllByOwnerIdAndParentIdAndNameIgnoreCase(Long ownerId, Long parentId, String name);

    @Modifying
    @Query("delete from categories where ownerId = ?1")
    void removeByOwnerId(Long ownerId);

    @Modifying
    @Query("insert into categories (id, ownerId, parentId, name, created, updated) values (?1, ?2, ?3, ?4, ?5, ?6)")
    void insertCategoryWithId(Long id, Long ownerId, Long parentId, String name, LocalDateTime created,
            LocalDateTime updated);

    @Modifying
    @Query("update categories set parentId = ?2 where parentId = ?1")
    int replaceParentId(Long categoryId, Long replaceId);
}
