import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductListComponent } from './product-list.component';
import { ProductService } from '../../core/services/product.service';
import { NotificationService } from '../../core/services/notification.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Product } from '../../core/models/product.model';

describe('ProductListComponent', () => {
  let component: ProductListComponent;
  let fixture: ComponentFixture<ProductListComponent>;
  let productServiceSpy: jest.Mocked<Pick<ProductService, 'getProducts' | 'deleteProduct'>>;
  let routerSpy: jest.Mocked<Pick<Router, 'navigate'>>;

  const mockProducts: Product[] = [
    {
      id: 'uno',
      name: 'Tarjeta Crédito',
      description: 'Descripción tarjeta de crédito',
      logo: 'assets-1.png',
      date_release: '2026-12-01',
      date_revision: '2027-12-01'
    },
    {
      id: 'dos',
      name: 'Cuenta Ahorros',
      description: 'Cuenta de ahorros digital',
      logo: 'assets-2.png',
      date_release: '2026-12-01',
      date_revision: '2027-12-01'
    }
  ];

  beforeEach(async () => {
    productServiceSpy = {
      getProducts: jest.fn<ProductService['getProducts']>().mockReturnValue(of({ data: mockProducts })),
      deleteProduct: jest.fn<ProductService['deleteProduct']>().mockReturnValue(of({ message: 'Product removed successfully' }))
    };
    routerSpy = { navigate: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [ProductListComponent],
      providers: [
        { provide: ProductService, useValue: productServiceSpy },
        { provide: Router, useValue: routerSpy },
        NotificationService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crear el componente y cargar los productos iniciales', () => {
    expect(component).toBeTruthy();
    expect(component.allProducts.length).toBe(2);
    expect(component.filteredProducts.length).toBe(2);
  });

  it('debe filtrar productos por término de búsqueda (F2)', () => {
    component.searchQuery = 'Ahorros';
    component.applyFilter();
    expect(component.filteredProducts.length).toBe(1);
    expect(component.filteredProducts[0].id).toBe('dos');
  });

  it('debe mostrar el logo con URL como imagen en la tabla', () => {
    const logoUrl = 'https://www.visa.com.ec/dam/VCOM/regional/lac/SPA/Default/Pay%20With%20Visa/Tarjetas/visa-signature-400x225.jpg';
    component.allProducts = [{ ...mockProducts[0], logo: logoUrl }];
    component.filteredProducts = [...component.allProducts];
    fixture.detectChanges();

    const logoImage = fixture.nativeElement.querySelector('.products-table .avatar-circle img') as HTMLImageElement;
    expect(logoImage).not.toBeNull();
    expect(logoImage.getAttribute('src')).toBe(logoUrl);
  });

  it('debe mostrar todos los productos cuando la búsqueda está vacía', () => {
    component.searchQuery = '   ';
    component.applyFilter();

    expect(component.filteredProducts).toEqual(mockProducts);
  });

  it('debe controlar la paginación y reiniciarla al cambiar el tamaño', () => {
    component.pageSize = 1;
    component.nextPage();
    expect(component.currentPage).toBe(2);
    expect(component.paginatedProducts).toEqual([mockProducts[1]]);

    component.nextPage();
    expect(component.currentPage).toBe(2);
    component.prevPage();
    expect(component.currentPage).toBe(1);
    component.prevPage();
    expect(component.currentPage).toBe(1);

    component.onPageSizeChange();
    expect(component.totalPages).toBe(2);
  });

  it('debe alternar el menú de acciones y obtener iniciales', () => {
    const event = new Event('click');
    component.toggleDropdown('uno', event);
    expect(component.openDropdownId).toBe('uno');
    component.toggleDropdown('uno', event);
    expect(component.openDropdownId).toBeNull();
    expect(component.getInitials('Tarjeta Crédito')).toBe('TC');
  });

  it('debe cerrar el estado de carga cuando falla la consulta de productos', () => {
    productServiceSpy.getProducts.mockReturnValueOnce(throwError(() => new Error('API error')));
    component.fetchProducts();

    expect(component.isLoading).toBe(false);
  });

  it('debe navegar a creación al hacer clic en Agregar', () => {
    component.goToCreate();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/products/create']);
  });

  it('debe navegar a edición con el ID seleccionado (F5)', () => {
    component.goToEdit(mockProducts[0]);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/products/edit', 'uno']);
  });

  it('debe abrir el modal y eliminar un producto al confirmar (F6)', () => {
    component.openDeleteModal(mockProducts[0]);
    expect(component.showDeleteModal).toBe(true);
    component.confirmDelete();
    expect(productServiceSpy.deleteProduct).toHaveBeenCalledWith('uno');
    expect(component.showDeleteModal).toBe(false);
  });

  it('no debe eliminar si no hay un producto seleccionado', () => {
    component.confirmDelete();

    expect(productServiceSpy.deleteProduct).not.toHaveBeenCalled();
  });
});