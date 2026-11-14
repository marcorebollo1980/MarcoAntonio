import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
  AsyncValidatorFn,
  ValidatorFn
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, of, map, catchError } from 'rxjs';
import { ProductService } from '../../core/services/product.service';
import { NotificationService } from '../../core/services/notification.service';

const isHttpUrl = (value: unknown): value is string => {
  if (typeof value !== 'string' || !value.trim()) return false;

  try {
    const url = new URL(value.trim());
    return (url.protocol === 'http:' || url.protocol === 'https:') && !!url.hostname;
  } catch {
    return false;
  }
};

const logoUrlValidator: ValidatorFn = (control) => {
  if (!control.value) return null;
  return isHttpUrl(control.value) ? null : { invalidUrl: true };
};

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss']
})
export class ProductFormComponent implements OnInit {
  productForm!: FormGroup;
  isEditMode: boolean = false;
  editId: string = '';
  isSubmitting: boolean = false;
  logoPreviewFailed: boolean = false;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.editId = this.route.snapshot.paramMap.get('id') || '';
    this.isEditMode = !!this.editId;

    this.buildForm();

    if (this.isEditMode) {
      this.loadProductForEdit();
    }
  }

  buildForm(): void {
    this.productForm = this.fb.group(
      {
        id: [
          { value: '', disabled: this.isEditMode },
          [Validators.required, Validators.minLength(3), Validators.maxLength(10)],
          this.isEditMode ? [] : [this.uniqueIdValidator()]
        ],
        name: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
        description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(200)]],
        logo: ['', [Validators.required, logoUrlValidator]],
        date_release: ['', [Validators.required, this.minTodayValidator]],
        date_revision: ['', [Validators.required]]
      },
      { validators: this.exactOneYearAfterValidator }
    );

    // Calcular automáticamente fecha de revisión (+1 año exacto) cuando cambia date_release
    this.productForm.get('date_release')?.valueChanges.subscribe((releaseVal: string) => {
      if (releaseVal) {
        const oneYearLater = this.addOneYear(releaseVal);
        this.productForm.get('date_revision')?.setValue(oneYearLater);
        this.productForm.get('date_revision')?.markAsTouched();
      }
    });
  }

  get logoPreviewUrl(): string | null {
    const value = this.productForm?.get('logo')?.value;
    return isHttpUrl(value) ? value.trim() : null;
  }

  resetLogoPreview(): void {
    this.logoPreviewFailed = false;
  }

  onLogoPreviewError(): void {
    this.logoPreviewFailed = true;
  }

  addOneYear(dateStr: string): string {
    const parts = dateStr.split('-').map(Number);
    if (parts.length !== 3) return '';
    const [year, month, day] = parts;
    const nextYear = year + 1;
    // Manejo de año bisiesto (29 feb -> 28 feb)
    const isLeapAdjust = month === 2 && day === 29 && !((nextYear % 4 === 0 && nextYear % 100 !== 0) || nextYear % 400 === 0);
    const targetDay = isLeapAdjust ? 28 : day;
    return `${nextYear}-${String(month).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;
  }

  minTodayValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const [y, m, d] = control.value.split('-').map(Number);
    const inputDate = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return inputDate >= today ? null : { minToday: true };
  }

  exactOneYearAfterValidator = (group: AbstractControl): ValidationErrors | null => {
    const release = group.get('date_release')?.value;
    const revision = group.get('date_revision')?.value;
    if (!release || !revision) return null;

    const expectedRevision = this.addOneYear(release);
    return revision === expectedRevision ? null : { notOneYearAfter: true };
  };

  uniqueIdValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const value = (control.value || '').trim();
      if (!value || value.length < 3) {
        return of(null);
      }
      return this.productService.verifyIdExists(value).pipe(
        map((exists) => (exists ? { idExists: true } : null)),
        catchError(() => of({ idVerificationFailed: true }))
      );
    };
  }

  loadProductForEdit(): void {
    this.productService.getProducts().subscribe({
      next: (res) => {
        const found = res.data.find((p) => p.id === this.editId);
        if (found) {
          this.productForm.patchValue({
            id: found.id,
            name: found.name,
            description: found.description,
            logo: found.logo,
            date_release: found.date_release.split('T')[0],
            date_revision: found.date_revision.split('T')[0]
          });
        } else {
          this.notificationService.showError('Producto no encontrado.');
          this.router.navigate(['/products']);
        }
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.productForm.get(fieldName);
    if (fieldName === 'date_revision' && this.productForm.hasError('notOneYearAfter') && control?.touched) {
      return true;
    }
    return !!(control && control.invalid && (control.touched || control.dirty));
  }

  onReset(): void {
    if (this.isEditMode) {
      this.productForm.patchValue({
        name: '',
        description: '',
        logo: '',
        date_release: '',
        date_revision: ''
      });
      this.productForm.markAsUntouched();
    } else {
      this.productForm.reset();
    }
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const rawValues = this.productForm.getRawValue();

    if (this.isEditMode) {
      const { id, ...updatePayload } = rawValues;
      this.productService.updateProduct(this.editId, updatePayload).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.notificationService.showSuccess('Producto actualizado exitosamente.');
          this.router.navigate(['/products']);
        },
        error: () => {
          this.isSubmitting = false;
        }
      });
    } else {
      this.productService.createProduct(rawValues).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.notificationService.showSuccess('Producto creado exitosamente.');
          this.router.navigate(['/products']);
        },
        error: () => {
          this.isSubmitting = false;
        }
      });
    }
  }
}