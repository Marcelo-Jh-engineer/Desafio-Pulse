
FROM maven:3.9-eclipse-temurin-21 AS construcao

WORKDIR /construcao

COPY pom.xml .
COPY src ./src


RUN --mount=type=cache,target=/root/.m2 mvn -B -Dmaven.test.skip=true package

FROM eclipse-temurin:21-jre-alpine

# Processo sem privilegio: um comprometimento na API nao vira root no container.
RUN addgroup -S pulse && adduser -S pulse -G pulse
USER pulse

WORKDIR /app
COPY --from=construcao /construcao/target/*.jar app.jar

EXPOSE 8080

# O front so deve receber trafego depois que a API responde de verdade.
HEALTHCHECK --interval=10s --timeout=5s --start-period=60s --retries=10 \
    CMD wget -qO- http://127.0.0.1:8080/api/hello > /dev/null || exit 1

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
