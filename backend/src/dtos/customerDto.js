/**
 * DTO untuk data kendaraan pelanggan
 * @class CustomerVehicleDto
 */
class CustomerVehicleDto {
  constructor(data) {
    this.id = data.id;
    this.plateNumber = data.plateNumber;
    this.brand = data.brand;
    this.model = data.model;
    this.createdAt = data.createdAt;
  }
}

/**
 * DTO untuk ringkasan kendaraan dalam order (nested dalam CustomerOrderDto)
 * @class CustomerOrderVehicleDto
 */
class CustomerOrderVehicleDto {
  constructor(data) {
    this.id = data.id;
    this.plateNumber = data.plateNumber;
    this.brand = data.brand;
    this.model = data.model;
  }
}

/**
 * DTO untuk ringkasan order milik pelanggan (nested dalam Customer)
 * @class CustomerOrderDto
 */
class CustomerOrderDto {
  constructor(data) {
    this.id = data.id;
    this.orderNumber = data.orderNumber;
    this.status = data.status;
    this.total = data.total;
    this.createdAt = data.createdAt;
    this.vehicle = data.vehicle
      ? new CustomerOrderVehicleDto(data.vehicle)
      : null;
  }
}

/**
 * DTO untuk response detail pelanggan (get by ID / phone)
 * Mengandung data lengkap termasuk vehicles, orders, dan jumlah relasi
 * @class CustomerDetailDto
 */
class CustomerDetailDto {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.phone = data.phone;
    this.createdAt = data.createdAt;
    this.vehicles = data.vehicles?.map((v) => new CustomerVehicleDto(v)) ?? [];
    this.orders = data.orders?.map((o) => new CustomerOrderDto(o)) ?? [];
    this.totalVehicles = data._count?.vehicles ?? 0;
    this.totalOrders = data._count?.orders ?? 0;
  }
}

/**
 * DTO untuk ringkasan pelanggan dalam list (get customers)
 * Mengandung vehicles summary dan jumlah statistik
 * @class CustomerListDto
 */
class CustomerListDto {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.phone = data.phone;
    this.createdAt = data.createdAt;
    this.vehicles = data.vehicles?.map((v) => new CustomerVehicleDto(v)) ?? [];
    this.totalVehicles = data._count?.vehicles ?? 0;
    this.totalOrders = data._count?.orders ?? 0;
  }
}

/**
 * DTO untuk response setelah create/update pelanggan
 * Hanya berisi data dasar pelanggan
 * @class CustomerDto
 */
class CustomerDto {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.phone = data.phone;
    this.createdAt = data.createdAt;
  }
}

export {
  CustomerVehicleDto,
  CustomerOrderVehicleDto,
  CustomerOrderDto,
  CustomerDetailDto,
  CustomerListDto,
  CustomerDto,
};