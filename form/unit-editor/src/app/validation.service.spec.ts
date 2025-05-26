import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ValidationService, ValidationResult } from './validation.service';
import { UnitDataService } from './unit-data.service';
import { of, throwError } from 'rxjs';
// Import specific schemas if needed for constructing test data, but not strictly necessary for these tests
// import { Solo, Warcaster } from './schemas/units';

// Mock UnitDataService
class MockUnitDataService {
  getFactionKeys = jasmine.createSpy('getFactionKeys').and.returnValue(of(['mercenaries', 'cygnar', 'cryx']));
  getArmyKeys = jasmine.createSpy('getArmyKeys').and.returnValue(of(['army1', 'army2', 'immune_to_this_army']));
  getAdvantageKeys = jasmine.createSpy('getAdvantageKeys').and.returnValue(of(['advantage1', 'advantage2']));
  getQualityKeys = jasmine.createSpy('getQualityKeys').and.returnValue(of(['quality1', 'quality2']));
  // getRuleKeys and getSpellKeys can be added if specific tests need them
}

describe('ValidationService', () => {
  let service: ValidationService;
  let mockUnitDataService: MockUnitDataService;

  const validSoloBase = {
    type: 'solo', name: 'Test Solo', faction: 'mercenaries', baseSize: 30, fieldAllowance: 1,
    keywords: ['solo', 'test'], points: 5, armies: ['army1'], advantages: ['advantage1'],
    statistics: { health: 1, speed: 6, meleeAttack: 6, defense: 14, armour: 14 },
    abilities: [], weapons: { sword: { name: 'Sword', type: 'melee', quantity: 1, qualities: ['quality1'], statistics: {range:0.5, power:10, rateOfFire:1} } }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ValidationService,
        { provide: UnitDataService, useClass: MockUnitDataService }
      ]
    });
    service = TestBed.inject(ValidationService);
    mockUnitDataService = TestBed.inject(UnitDataService) as any;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('validateUnit (Asynchronous)', () => {
    it('should return success for fully valid solo data (Zod + custom keys)', fakeAsync(() => {
      let result: ValidationResult | null = null;
      service.validateUnit(validSoloBase).subscribe(res => result = res);
      tick();

      expect(result).not.toBeNull();
      expect(result?.success).toBe(true);
      expect(result?.errors.length).toBe(0);
    }));

    it('should return Zod errors if Zod validation fails, even if async checks might pass', fakeAsync(() => {
      const invalidData = { ...validSoloBase, name: undefined }; // name is required by Zod
      let result: ValidationResult | null = null;
      service.validateUnit(invalidData).subscribe(res => result = res);
      tick();

      expect(result?.success).toBe(false);
      expect(result?.errors.some(e => e.path === 'name' && e.message.includes('Required'))).toBe(true);
    }));

    it('should return failure if Zod passes but faction key is invalid', fakeAsync(() => {
      const invalidFactionData = { ...validSoloBase, faction: 'unknown_faction' };
      let result: ValidationResult | null = null;
      service.validateUnit(invalidFactionData).subscribe(res => result = res);
      tick();

      expect(result?.success).toBe(false);
      expect(result?.errors.some(e => e.path === 'faction' && e.message.includes("Invalid faction: 'unknown_faction'"))).toBe(true);
    }));

    it('should return failure if Zod passes but an army key is invalid', fakeAsync(() => {
      const invalidArmyData = { ...validSoloBase, armies: ['army1', 'unknown_army'] };
      let result: ValidationResult | null = null;
      service.validateUnit(invalidArmyData).subscribe(res => result = res);
      tick();

      expect(result?.success).toBe(false);
      expect(result?.errors.some(e => e.path === 'armies[1]' && e.message.includes("Invalid army: 'unknown_army'"))).toBe(true);
    }));

    it('should return failure if Zod passes but an advantage key is invalid', fakeAsync(() => {
      const invalidAdvantageData = { ...validSoloBase, advantages: ['advantage1', 'unknown_advantage'] };
      let result: ValidationResult | null = null;
      service.validateUnit(invalidAdvantageData).subscribe(res => result = res);
      tick();

      expect(result?.success).toBe(false);
      expect(result?.errors.some(e => e.path === 'advantages[1]' && e.message.includes("Invalid advantage: 'unknown_advantage'"))).toBe(true);
    }));

    it('should return failure if Zod passes but a weapon quality is invalid', fakeAsync(() => {
      const invalidQualityData = { ...validSoloBase, weapons: { ...validSoloBase.weapons, sword: { ...validSoloBase.weapons.sword, qualities: ['quality1', 'unknown_quality'] } } };
      let result: ValidationResult | null = null;
      service.validateUnit(invalidQualityData).subscribe(res => result = res);
      tick();

      expect(result?.success).toBe(false);
      expect(result?.errors.some(e => e.path === 'weapons.sword.qualities[1]' && e.message.includes("Invalid quality: 'unknown_quality'"))).toBe(true);
    }));

    it('should handle empty key list from UnitDataService for factions (fail if unit has faction)', fakeAsync(() => {
      mockUnitDataService.getFactionKeys.and.returnValue(of([]));
      const dataWithFaction = { ...validSoloBase, faction: 'mercenaries' }; // This faction now has no valid source
      let result: ValidationResult | null = null;
      service.validateUnit(dataWithFaction).subscribe(res => result = res);
      tick();

      expect(result?.success).toBe(false);
      expect(result?.errors.some(e => e.path === 'faction' && e.message.includes("Invalid faction: 'mercenaries'"))).toBe(true);
    }));

    it('should handle empty key list from UnitDataService for factions (pass if unit has no faction and Zod allows it - current Zod requires it)', fakeAsync(() => {
      // This test assumes faction is optional in Zod, which is NOT the case in current BaseUnit.
      // If BaseUnit.faction was .optional(), this test would be more relevant.
      // For now, it will fail due to Zod validation if faction is missing.
      // Let's test it as if Zod allows optional faction and the unit has no faction.
      mockUnitDataService.getFactionKeys.and.returnValue(of([]));
      const dataWithoutFaction = { ...validSoloBase, faction: undefined }; // Zod will catch this as faction is required

      let result: ValidationResult | null = null;
      service.validateUnit(dataWithoutFaction).subscribe(res => result = res);
      tick();

      // Expecting Zod error because faction is required by schema
      expect(result?.success).toBe(false);
      expect(result?.errors.some(e => e.path === 'faction' && e.message.includes('Required'))).toBe(true);
    }));

    it('should handle UnitDataService errors gracefully (e.g., faction key fetch error)', fakeAsync(() => {
      mockUnitDataService.getFactionKeys.and.returnValue(throwError(() => new Error('Fetch error')));
      let result: ValidationResult | null = null;
      service.validateUnit(validSoloBase).subscribe(res => result = res);
      tick();

      expect(result?.success).toBe(false);
      expect(result?.errors.some(e => e.path === 'faction' && e.message.includes('Could not load factions for validation.'))).toBe(true);
    }));

    it('should combine Zod errors and custom key validation errors', fakeAsync(() => {
      const highlyInvalidData = {
        ...validSoloBase,
        name: undefined, // Zod error
        faction: 'unknown_faction', // Custom error
        armies: ['army1', 'unknown_army'] // Custom error
      };
      let result: ValidationResult | null = null;
      service.validateUnit(highlyInvalidData).subscribe(res => result = res);
      tick();

      expect(result?.success).toBe(false);
      expect(result?.errors.length).toBeGreaterThanOrEqual(3); // At least name, faction, and one army error
      expect(result?.errors.some(e => e.path === 'name' && e.message.includes('Required'))).toBe(true);
      expect(result?.errors.some(e => e.path === 'faction' && e.message.includes("Invalid faction: 'unknown_faction'"))).toBe(true);
      expect(result?.errors.some(e => e.path === 'armies[1]' && e.message.includes("Invalid army: 'unknown_army'"))).toBe(true);
    }));

    // Test for missing unit type (already synchronous, but good to keep)
    it('should return failure if unit type is missing (synchronous part)', (done) => {
      const noTypeData = { name: 'Test No Type' };
      service.validateUnit(noTypeData).subscribe(result => {
        expect(result.success).toBe(false);
        expect(result.errors).toBeDefined();
        expect(result.errors.some(e => e.path === 'type' && e.message.includes("Invalid unit type for schema retrieval."))).toBe(true);
        done();
      });
    });

    // Test for unknown unit type (already synchronous, but good to keep)
    it('should return failure for an unknown unit type (synchronous part)', (done) => {
      const unknownTypeData = { type: 'dragon', name: 'Test Dragon' };
      service.validateUnit(unknownTypeData).subscribe(result => {
        expect(result.success).toBe(false);
        expect(result.errors).toBeDefined();
        expect(result.errors.some(e => e.path === 'type' && e.message.includes('Invalid unit type dragon'))).toBe(true);
        done();
      });
    });
  });
});
