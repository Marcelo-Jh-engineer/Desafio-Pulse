package com.api.ecommerce;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableScheduling;

// O scan registra PropriedadesDoKeycloak sem precisar anotar a classe de
// configuracao uma por uma.
//
// @EnableScheduling liga o PublicadorDeEventos, que varre o outbox a cada 2
// segundos. Sem ele o @Scheduled e ignorado em silencio: os eventos ficariam
// gravados para sempre e nada chegaria ao broker.
@SpringBootApplication
@ConfigurationPropertiesScan
@EnableScheduling
public class EcommerceApplication {

	public static void main(String[] args) {
		SpringApplication.run(EcommerceApplication.class, args);
	}

}
