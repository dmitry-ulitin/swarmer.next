package com.swarmer.finance.services;

import java.io.IOException;
import java.time.LocalDateTime;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.test.context.TestConstructor;
import org.springframework.test.context.TestPropertySource;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.swarmer.finance.dto.Dump;
import com.swarmer.finance.models.User;

import jakarta.persistence.EntityManager;

@DataJpaTest(showSql = true, includeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = {
        DataService.class }))
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@TestPropertySource(locations = "classpath:application-test.properties")
@TestConstructor(autowireMode = TestConstructor.AutowireMode.ALL)
public class DataServiceTest {
    @Autowired
    DataService dataService;
    @Autowired
    EntityManager entityManager;
    private final User user = new User(null, "test@test.com", "{noop}123456", true, "Test", "USD", LocalDateTime.now(),
            LocalDateTime.now(), "test@gmail.com");

    @BeforeEach
    void init() {
        entityManager.persist(user);
        entityManager.flush();
    }

    @Test
    void testGetDump() {
    }

    @Test
    void testLoadDump() throws IOException {
        var is = this.getClass().getClassLoader().getResourceAsStream("export_2023-03-29T14_09.json");
        var objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        Dump dump = objectMapper.readValue(is, Dump.class);
        dataService.loadDump(user.getId(), dump);
    }
}
