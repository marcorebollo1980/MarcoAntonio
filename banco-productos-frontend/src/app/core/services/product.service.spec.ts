import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProductService } from './product.service';
import { Product } from '../models/product.model';

describe('ProductService', () => {
  let service: ProductService;
  let httpMock: HttpTestingController;
  const baseUrl = '/bp/products';

  const mockProduct: Product = {
    id: 'trj-crd',
    name: 'Tarjetas de Crédito',
    description: 'Tarjeta de consumo bajo la modalidad de crédito',
    logo: 'assets-1.png',
    date_release: '2026-12-01',
    date_revision: '2027-12-01'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProductService]
    });
    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe obtener la lista de productos (GET)', () => {
    service.getProducts().subscribe(res => {
      expect(res.data.length).toBe(1);
      expect(res.data[0].id).toEqual('trj-crd');
    });

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('GET');
    req.flush({ data: [mockProduct] });
  });

  it('debe verificar si un ID existe (GET /verification/:id)', () => {
    service.verifyIdExists('trj-crd').subscribe(exists => {
      expect(exists).toBe(true);
    });

    const req = httpMock.expectOne(`${baseUrl}/verification/trj-crd`);
    expect(req.request.method).toBe('GET');
    req.flush(true);
  });

  it('debe crear un producto financiero (POST)', () => {
    service.createProduct(mockProduct).subscribe(res => {
      expect(res.message).toBe('Product added successfully');
    });

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'Product added successfully', data: mockProduct });
  });

  it('debe actualizar un producto financiero (PUT)', () => {
    const { id, ...body } = mockProduct;
    service.updateProduct(id, body).subscribe(res => {
      expect(res.message).toBe('Product updated successfully');
    });

    const req = httpMock.expectOne(`${baseUrl}/trj-crd`);
    expect(req.request.method).toBe('PUT');
    req.flush({ message: 'Product updated successfully', data: mockProduct });
  });

  it('debe eliminar un producto financiero (DELETE)', () => {
    service.deleteProduct('trj-crd').subscribe(res => {
      expect(res.message).toBe('Product removed successfully');
    });

    const req = httpMock.expectOne(`${baseUrl}/trj-crd`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'Product removed successfully' });
  });
});