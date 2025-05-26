import { Injectable } from '@angular/core';
import { ZodError, ZodSchema } from 'zod';
import { BaseUnit, Warcaster, Solo, Unit, Warjack, Attachment, unitSchema } from './schemas/units';
import AbilitySchema from './schemas/Ability';
import AdvantageSchema from './schemas/Advantage';
import ArmySchema from './schemas/Army';
import CommandCardSchema from './schemas/CommandCard';
import FactionSchema from './schemas/Faction';
import QualitySchema from './schemas/Quality';
import RuleSchema from './schemas/Rule';
import SpellSchema from './schemas/Spell';
import PrimitivesSchema from './schemas/primitives'; // Assuming this exports something or is needed for other schemas

@Injectable({
  providedIn: 'root'
})
export class ValidationService {

  constructor() { }

  validateUnit(unitData: any): { success: boolean; errors?: any } {
    if (!unitData || typeof unitData.type !== 'string') {
      return {
        success: false,
        errors: { message: "Invalid unit data: 'type' field is missing or not a string." }
      };
    }

    try {
      const schema: ZodSchema<any> = unitSchema(unitData); // unitSchema should return the correct Zod schema
      const validationResult = schema.safeParse(unitData);

      if (validationResult.success) {
        return { success: true };
      } else {
        // Simplify ZodError to a more user-friendly format if needed
        const errors = this.formatZodErrors(validationResult.error);
        console.error('Validation failed:', errors);
        return { success: false, errors };
      }
    } catch (error: any) {
      // This catch block handles errors from unitSchema (e.g., invalid type)
      console.error('Error during schema retrieval or validation:', error);
      return { success: false, errors: { message: error.message || 'An unexpected error occurred during validation.' } };
    }
  }

  private formatZodErrors(error: ZodError): any {
    return error.errors.map(err => ({
      path: err.path.join('.'),
      message: err.message
    }));
  }

  // Expose individual schemas if needed for other validation tasks
  getAbilitySchema(): ZodSchema<any> { return AbilitySchema; }
  getAdvantageSchema(): ZodSchema<any> { return AdvantageSchema; }
  getArmySchema(): ZodSchema<any> { return ArmySchema; }
  getCommandCardSchema(): ZodSchema<any> { return CommandCardSchema; }
  getFactionSchema(): ZodSchema<any> { return FactionSchema; }
  getQualitySchema(): ZodSchema<any> { return QualitySchema; }
  getRuleSchema(): ZodSchema<any> { return RuleSchema; }
  getSpellSchema(): ZodSchema<any> { return SpellSchema; }

  // Schemas from units.ts (these are already Zod objects, not functions returning them)
  getBaseUnitSchema(): ZodSchema<any> { return BaseUnit; }
  getWarcasterSchema(): ZodSchema<any> { return Warcaster; }
  getSoloSchema(): ZodSchema<any> { return Solo; }
  getUnitSchema(): ZodSchema<any> { return Unit; }
  getWarjackSchema(): ZodSchema<any> { return Warjack; }
  getAttachmentSchema(): ZodSchema<any> { return Attachment; }
}
