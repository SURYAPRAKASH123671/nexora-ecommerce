FROM maven:3.9.11-eclipse-temurin-17-alpine AS build
WORKDIR /workspace
COPY pom.xml mvnw mvnw.cmd ./
COPY .mvn .mvn
RUN mvn -B -q dependency:go-offline
COPY src src
RUN mvn -B clean package

FROM eclipse-temurin:17-jre-alpine
RUN addgroup -S nexora && adduser -S nexora -G nexora
WORKDIR /app
COPY --from=build /workspace/target/ecommerce-backend-0.0.1-SNAPSHOT.jar app.jar
RUN mkdir -p /app/data/payment-proofs && chown -R nexora:nexora /app/data
USER nexora
EXPOSE 8080
ENV SPRING_PROFILES_ACTIVE=prod
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-Djava.security.egd=file:/dev/./urandom", "-jar", "/app/app.jar"]
