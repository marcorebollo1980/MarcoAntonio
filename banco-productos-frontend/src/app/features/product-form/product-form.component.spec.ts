import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductFormComponent } from './product-form.component';
import { ProductService } from '../../core/services/product.service';
import { NotificationService } from '../../core/services/notification.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import { firstValueFrom, isObservable, of, throwError } from 'rxjs';

describe('ProductFormComponent', () => {
  let component: ProductFormComponent;
  let fixture: ComponentFixture<ProductFormComponent>;
  let productServiceSpy: jest.Mocked<Pick<
    ProductService,
    'verifyIdExists' | 'createProduct' | 'updateProduct' | 'getProducts'
  >>;
  let routerSpy: jest.Mocked<Pick<Router, 'navigate'>>;

  beforeEach(async () => {
    productServiceSpy = {
      verifyIdExists: jest.fn<ProductService['verifyIdExists']>().mockReturnValue(of(false)),
      createProduct: jest.fn<ProductService['createProduct']>().mockReturnValue(of({ message: 'Product added successfully' })),
      updateProduct: jest.fn<ProductService['updateProduct']>(),
      getProducts: jest.fn<ProductService['getProducts']>()
    };
    routerSpy = { navigate: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [ProductFormComponent],
      providers: [
        { provide: ProductService, useValue: productServiceSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => null } } }
        },
        NotificationService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crear el formulario en modo registro', () => {
    expect(component).toBeTruthy();
    expect(component.isEditMode).toBe(false);
  });

  it('debe calcular automáticamente date_revision exactamente un año después de date_release', () => {
    component.productForm.get('date_release')?.setValue('2027-05-15');
    expect(component.productForm.get('date_revision')?.value).toBe('2028-05-15');
  });

  it('debe ajustar al 28 de febrero al sumar un año a una fecha bisiesta', () => {
    expect(component.addOneYear('2024-02-29')).toBe('2025-02-28');
    expect(component.addOneYear('fecha-inválida')).toBe('');
  });

  it('debe invalidar fechas anteriores al día actual', () => {
    component.productForm.get('date_release')?.setValue('2020-01-01');
    expect(component.productForm.get('date_release')?.hasError('minToday')).toBe(true);
  });

  it('debe aceptar la URL de Visa y mostrarla en la vista previa', () => {
    const logoUrl = 'https://www.visa.com.ec/dam/VCOM/regional/lac/SPA/Default/Pay%20With%20Visa/Tarjetas/visa-signature-400x225.jpg';
    const logoControl = component.productForm.get('logo');

    logoControl?.setValue(logoUrl);
    fixture.detectChanges();

    expect(logoControl?.valid).toBe(true);
    const preview = fixture.nativeElement.querySelector('.logo-preview img') as HTMLImageElement;
    expect(preview).not.toBeNull();
    expect(preview.getAttribute('src')).toBe(logoUrl);
  });

  it('debe rechazar texto que no sea una URL HTTP o HTTPS y ocultar la vista previa', () => {
    const logoControl = component.productForm.get('logo');
    logoControl?.setValue('assets-1.png');
    logoControl?.markAsTouched();
    fixture.detectChanges();

    expect(logoControl?.hasError('invalidUrl')).toBe(true);
    expect(fixture.nativeElement.querySelector('.logo-preview')).toBeNull();
    expect(fixture.nativeElement.querySelector('.error-text').textContent).toContain('URL válida');
  });

  it('debe validar que la fecha de revisión sea exactamente un año después', () => {
    component.productForm.patchValue({
      date_release: '2027-05-15',
      date_revision: '2028-05-16'
    });

    expect(component.productForm.hasError('notOneYearAfter')).toBe(true);
    component.productForm.get('date_revision')?.markAsUntouched();
    expect(component.isFieldInvalid('date_revision')).toBe(false);
    component.productForm.get('date_revision')?.markAsTouched();
    expect(component.isFieldInvalid('date_revision')).toBe(true);
  });

  it('debe omitir la consulta de ID corto y reportar IDs existentes', async () => {
    const validator = component.uniqueIdValidator();
    const shortIdResult = validator(new FormControl('ab'));
    expect(isObservable(shortIdResult)).toBe(true);
    if (!isObservable(shortIdResult)) {
      throw new Error('Expected an observable validation result');
    }
    expect(await firstValueFrom(shortIdResult)).toBeNull();
    expect(productServiceSpy.verifyIdExists).not.toHaveBeenCalled();

    productServiceSpy.verifyIdExists.mockReturnValueOnce(of(true));
    const existingIdResult = validator(new FormControl('valid-id'));
    expect(isObservable(existingIdResult)).toBe(true);
    if (!isObservable(existingIdResult)) {
      throw new Error('Expected an observable validation result');
    }
    expect(await firstValueFrom(existingIdResult)).toEqual({ idExists: true });
  });

  it('debe bloquear el envío y mostrar un error si no se puede verificar el ID', async () => {
    productServiceSpy.verifyIdExists.mockReturnValueOnce(
      throwError(() => new Error('Backend unavailable'))
    );

    const idControl = component.productForm.get('id');
    idControl?.setValue('prod-123');
    idControl?.markAsTouched();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(idControl?.hasError('idVerificationFailed')).toBe(true);
    expect(component.productForm.invalid).toBe(true);
    expect(fixture.nativeElement.querySelector('.form-field .error-text').textContent)
      .toContain('No se pudo verificar el ID');

    component.onSubmit();
    expect(productServiceSpy.createProduct).not.toHaveBeenCalled();
  });

  it('debe limpiar el formulario al ejecutar onReset()', () => {
    component.productForm.get('name')?.setValue('Producto Test');
    component.onReset();
    expect(component.productForm.get('name')?.value).toBeNull();
  });

  it('debe restablecer los campos editables sin modificar el ID al reiniciar en modo edición', () => {
    component.isEditMode = true;
    component.productForm.patchValue({ id: 'prod-123', name: 'Producto Test' });

    component.onReset();

    expect(component.productForm.get('id')?.value).toBe('prod-123');
    expect(component.productForm.get('name')?.value).toBe('');
  });

  it('no debe enviar un formulario inválido', () => {
    component.onSubmit();

    expect(productServiceSpy.createProduct).not.toHaveBeenCalled();
    expect(component.isSubmitting).toBe(false);
  });

  it('debe enviar el formulario válido y navegar a /products', () => {
    component.productForm.patchValue({
      id: 'prod-123',
      name: 'Cuenta Corriente Empresarial',
      description: 'Cuenta corriente para empresas y comercios',
      logo: 'https://example.com/logo.png',
      date_release: '2027-01-10',
      date_revision: '2028-01-10'
    });

    component.onSubmit();
    expect(productServiceSpy.createProduct).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/products']);
  });
});