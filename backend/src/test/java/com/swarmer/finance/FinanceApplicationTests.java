package com.swarmer.finance;

import java.util.Map;

import static org.assertj.core.api.Assertions.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.reactive.server.WebTestClient;

import com.auth0.jwt.JWT;
import com.swarmer.finance.dto.UserToCreate;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(locations = "classpath:application-test.properties")
class FinanceApplicationTests {

	@Autowired
	WebTestClient webTestClient;

	@Test
	void contextLoads() {
	}

	@Test
	void addNewUser() {
		var userToCreate = new UserToCreate("user@email.com", "password", "User Name", null);

		webTestClient
				.post()
				.uri("/api/register")
				.bodyValue(userToCreate)
				.exchange()
				.expectStatus()
				.isOk()
				.expectBody(new ParameterizedTypeReference<Map<String, Object>>() {})
				.value(response -> {
					var jwt = JWT.decode(response.get("access_token").toString());
					assertThat(jwt.getSubject()).isEqualTo(userToCreate.email());
					assertThat(jwt.getClaim("id").asLong()).isNotNull();
					assertThat(jwt.getClaim("currency").asString()).isEqualTo("EUR");
				});
	}
}
