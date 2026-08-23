# ---------------------------------------------------------------
# API do projeto "Voce no Coracao da Gente"
#
# Dois estagios: o primeiro compila com Maven, o segundo carrega so o JRE e o
# jar. A imagem final nao tem Maven, nem codigo-fonte, nem cache do .m2.
#
# Contexto de build: esta pasta (Back/ecommerce).
# ---------------------------------------------------------------
FROM maven:3.9-eclipse-temurin-21 AS construcao

WORKDIR /construcao

COPY pom.xml .
COPY src ./src

# Um passo so, com o .m2 num cache do BuildKit: as dependencias sobrevivem
# entre builds sem virar camada de imagem, e o segundo build nao baixa nada.
#
# `dependency:go-offline` faria o mesmo em teoria, mas resolve o grafo inteiro
# de plugins de uma vez — trabalho pesado o bastante para derrubar o daemon em
# maquina apertada, e ainda assim refeito a cada mudanca no pom.
#
# Sem testes: o build da imagem nao e o lugar de rodar suite.
RUN --mount=type=cache,target=/root/.m2 mvn -B -DskipTests package

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
