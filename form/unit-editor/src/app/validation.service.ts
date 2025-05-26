import { Injectable } from '@angular/core';
import { ZodError, ZodSchema } from 'zod';
import { BaseUnit, Warcaster, Solo, Unit, Warjack, Attachment, unitSchema } from './schemas/units'; // Assuming path is correct relative to this service
import AbilitySchema from './schemas/Ability';
import AdvantageSchema from './schemas/Advantage';
import ArmySchema from './schemas/Army';
import CommandCardSchema from './schemas/CommandCard';
import FactionSchema from './schemas/Faction';
import QualitySchema from './schemas/Quality';
import RuleSchema from './schemas/Rule';
import SpellSchema from './schemas/Spell';
// PrimitivesSchema is not explicitly used here but might be by imported schemas

import { UnitDataService } from './unit-data.service'; // Path to UnitDataService
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError, first } from 'rxjs/operators'; // switchMap removed as first() is used

export interface ValidationResult {
  success: boolean;
  errors: Array<{ path: string; message: string }>;
}

@Injectable({
  providedIn: 'root'
})
export class ValidationService {

  constructor(private unitDataService: UnitDataService) { }

  private formatZodErrors(error: ZodError): Array<{ path: string; message: string }> {
    return error.errors.map(err => ({
      path: err.path.join('.'),
      message: err.message
    }));
  }

  validateUnit(unitData: any): Observable<ValidationResult> {
    let initialErrors: Array<{ path: string; message: string }> = [];

    // Perform initial synchronous Zod schema validation
    try {
      const zodSchema: ZodSchema<any> = unitSchema(unitData); // Get the Zod schema based on unit type
      const zodParseResult = zodSchema.safeParse(unitData);

      if (!zodParseResult.success) {
        initialErrors = this.formatZodErrors(zodParseResult.error as ZodError);
      }
    } catch (error: any) {
      // This catches errors from unitSchema (e.g., invalid type)
      initialErrors.push({ path: 'type', message: error.message || 'Invalid unit type for schema retrieval.' });
    }

    const validationTasks: Observable<Array<{ path: string; message: string }>>[] = [];

    // Faction Validation
    if (unitData.faction) {
      validationTasks.push(
        this.unitDataService.getFactionKeys().pipe(
          first(),
          map(keys => {
            if (keys.length > 0 && !keys.includes(unitData.faction)) {
              return [{ path: 'faction', message: `Invalid faction: '${unitData.faction}'. Not found in known factions.` }];
            }
            return [];
          }),
          catchError(() => of([{ path: 'faction', message: 'Could not load factions for validation.' }]))
        )
      );
    } else if (!initialErrors.some(e => e.path === 'faction')) {
        // Add error if faction is missing and not already caught by Zod (e.g. if it's optional in Zod but required by context)
        // However, our current BaseUnit schema makes faction required. This is more of a safeguard.
        // initialErrors.push({ path: 'faction', message: 'Faction is required.' });
    }


    // Armies Validation
    if (unitData.armies && Array.isArray(unitData.armies) && unitData.armies.length > 0) {
      validationTasks.push(
        this.unitDataService.getArmyKeys().pipe(
          first(),
          map(keys => {
            const armyErrors: Array<{ path: string; message: string }> = [];
            if (keys.length === 0 && unitData.armies.length > 0) { // Data source for keys is empty, but unit has armies
                armyErrors.push({ path: 'armies', message: 'Cannot validate armies: No army data loaded from source.' });
            } else if (keys.length > 0) {
              unitData.armies.forEach((army: string, index: number) => {
                if (!keys.includes(army)) {
                  armyErrors.push({ path: `armies[${index}]`, message: `Invalid army: '${army}'. Not found in known armies.` });
                }
              });
            }
            return armyErrors;
          }),
          catchError(() => of([{ path: 'armies', message: 'Could not load armies for validation.' }]))
        )
      );
    }

    // Advantages Validation
    if (unitData.advantages && Array.isArray(unitData.advantages) && unitData.advantages.length > 0) {
      validationTasks.push(
        this.unitDataService.getAdvantageKeys().pipe(
          first(),
          map(keys => {
            const advantageErrors: Array<{ path: string; message: string }> = [];
            if (keys.length === 0 && unitData.advantages.length > 0) {
                advantageErrors.push({ path: 'advantages', message: 'Cannot validate advantages: No advantage data loaded from source.' });
            } else if (keys.length > 0) {
              unitData.advantages.forEach((advantage: string, index: number) => {
                if (!keys.includes(advantage)) {
                  advantageErrors.push({ path: `advantages[${index}]`, message: `Invalid advantage: '${advantage}'. Not found in known advantages.` });
                }
              });
            }
            return advantageErrors;
          }),
          catchError(() => of([{ path: 'advantages', message: 'Could not load advantages for validation.' }]))
        )
      );
    }

    // Weapon Qualities Validation
    if (unitData.weapons && typeof unitData.weapons === 'object') {
      validationTasks.push(
        this.unitDataService.getQualityKeys().pipe(
          first(),
          map(keys => {
            const qualityErrors: Array<{ path: string; message: string }> = [];
            if (keys.length === 0 && Object.values(unitData.weapons).some((w:any) => w.qualities && w.qualities.length > 0)) {
                qualityErrors.push({ path: 'weapons', message: 'Cannot validate weapon qualities: No quality data loaded from source.' });
            } else if (keys.length > 0) {
              for (const weaponName in unitData.weapons) {
                const weapon = unitData.weapons[weaponName];
                if (weapon.qualities && Array.isArray(weapon.qualities)) {
                  weapon.qualities.forEach((quality: string, index: number) => {
                    if (!keys.includes(quality)) {
                      qualityErrors.push({ path: `weapons.${weaponName}.qualities[${index}]`, message: `Invalid quality: '${quality}'. Not found in known qualities.` });
                    }
                  });
                }
              }
            }
            return qualityErrors;
          }),
          catchError(() => of([{ path: 'weapons.qualities', message: 'Could not load weapon qualities for validation.' }]))
        )
      );
    }

    if (validationTasks.length === 0) {
      return of({ success: initialErrors.length === 0, errors: initialErrors });
    }

    return forkJoin(validationTasks).pipe(
      map(results => {
        const customErrors = results.reduce((acc, val) => acc.concat(val), []);
        const allErrors = initialErrors.concat(customErrors);
        // Log all errors if any for debugging
        if (allErrors.length > 0) {
            console.error('Async Validation completed with errors:', allErrors);
        }
        return {
          success: allErrors.length === 0,
          errors: allErrors,
        };
      }),
      catchError((err) => {
        console.error('Unexpected error during forkJoin custom validation:', err);
        // Return initial Zod errors plus a generic custom validation error message
        return of({
            success: false,
            errors: initialErrors.concat([{path: 'validationTasks', message: 'Unexpected error during data-driven validation execution.'}])
        });
      })
    );
  }

  // Expose individual schemas (unchanged from previous version)
  getAbilitySchema(): ZodSchema<any> { return AbilitySchema; }
  getAdvantageSchema(): ZodSchema<any> { return AdvantageSchema; }
  getArmySchema(): ZodSchema<any> { return ArmySchema; }
  getCommandCardSchema(): ZodSchema<any> { return CommandCardSchema; }
  getFactionSchema(): ZodSchema<any> { return FactionSchema; }
  getQualitySchema(): ZodSchema<any> { return QualitySchema; }
  getRuleSchema(): ZodSchema<any> { return RuleSchema; }
  getSpellSchema(): ZodSchema<any> { return SpellSchema; }
  getBaseUnitSchema(): ZodSchema<any> { return BaseUnit; }
  getWarcasterSchema(): ZodSchema<any> { return Warcaster; }
  getSoloSchema(): ZodSchema<any> { return Solo; }
  getUnitSchema(): ZodSchema<any> { return Unit; }
  getWarjackSchema(): ZodSchema<any> { return Warjack; }
  getAttachmentSchema(): ZodSchema<any> { return Attachment; }
}
