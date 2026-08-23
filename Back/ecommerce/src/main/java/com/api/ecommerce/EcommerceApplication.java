package com.api.ecommerce;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

// O scan registra PropriedadesDoKeycloak sem precisar anotar a classe de
// configuracao uma por uma.
@SpringBootApplication
@ConfigurationPropertiesScan
public class EcommerceApplication {

	public static void main(String[] args) {
		SpringApplication.run(EcommerceApplication.class, args);
	}

}
