/**
 * Data Transfer Object untuk response Vehicle
 * @module dtos/vehicleDto
 */

class VehicleCustomerDto {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.phone = data.phone;
  }
}

class VehicleOrderDto {
  constructor(data) {
    this.id = data.id;
    this.orderNumber = data.orderNumber;
    this.status = data.status;
    this.total = data.total;
    this.createdAt = data.createdAt;
  }
}

class VehicleItemDto {
  constructor(data) {
    this.id = data.id;
    this.plateNumber = data.plateNumber;
    this.brand = data.brand;
    this.model = data.model;
    this.createdAt = data.createdAt;
    this.totalOrders = data._count?.orders ?? 0;
  }
}

class VehicleDetailDto {
  constructor(data) {
    this.id = data.id;
    this.plateNumber = data.plateNumber;
    this.brand = data.brand;
    this.model = data.model;
    this.createdAt = data.createdAt;
    this.customer = data.customer
      ? new VehicleCustomerDto(data.customer)
      : null;
    this.orders = data.orders?.map((o) => new VehicleOrderDto(o)) ?? [];
    this.totalOrders = data._count?.orders ?? 0;
  }
}

class VehicleListDto {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.phone = data.phone;
    this.createdAt = data.createdAt;
    this.vehicles = data.vehicles?.map((v) => new VehicleItemDto(v)) ?? [];
    this.totalVehicles = data.vehicles?.length || 0;
  }
}

class CustomerVehicleDto {
  constructor(data) {
    this.id = data.id;
    this.plateNumber = data.plateNumber;
    this.brand = data.brand;
    this.model = data.model;
    this.createdAt = data.createdAt;
    this.totalOrders = data._count?.orders ?? 0;
  }
}

class VehicleSearchDto {
  constructor(data) {
    this.id = data.id;
    this.plateNumber = data.plateNumber;
    this.brand = data.brand;
    this.model = data.model;
    this.customer = data.customer
      ? new VehicleCustomerDto(data.customer)
      : null;
  }
}

export {
  VehicleCustomerDto,
  VehicleOrderDto,
  VehicleItemDto,
  VehicleDetailDto,
  VehicleListDto,
  CustomerVehicleDto,
  VehicleSearchDto,
};