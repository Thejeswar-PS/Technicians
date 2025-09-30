#See https://aka.ms/containerfastmode to understand how Visual Studio uses this Dockerfile to build your images for faster debugging.

FROM mcr.microsoft.com/dotnet/aspnet:6.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:6.0 AS build
WORKDIR /src
COPY ["Technicians.Api/Technicians.Api.csproj", "Technicians.Api/"]
COPY ["SM.Infrastructure/SM.Infrastructure.csproj", "SM.Infrastructure/"]
COPY ["SM.Domain/SM.Domain.csproj", "SM.Domain/"]
COPY ["SM.Application/SM.Application.csproj", "SM.Application/"]
COPY ["Framework/Logistic.Framework.csproj", "Framework/"]
COPY ["Logistic.Service/Logistic.Service.csproj", "Logistic.Service/"]
RUN dotnet restore "Technicians.Api/Technicians.Api.csproj"
COPY . .
WORKDIR "/src/Technicians.Api"
RUN dotnet build "Technicians.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Technicians.Api.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Technicians.Api.dll"]