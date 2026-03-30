# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj and restore first for better layer caching
COPY AccountingApi.csproj ./
RUN dotnet restore ./AccountingApi.csproj

# Copy everything and publish
COPY . ./
RUN dotnet publish ./AccountingApi.csproj -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Render provides PORT dynamically
ENV ASPNETCORE_URLS=http://0.0.0.0:${PORT}
EXPOSE 10000

ENTRYPOINT ["dotnet", "AccountingApi.dll"]
