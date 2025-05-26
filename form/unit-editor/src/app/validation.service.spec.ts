import { TestBed } from '@angular/core/testing';
import { ValidationService } from './validation.service';
import { Solo, Warcaster } from './schemas/units'; // Import specific schemas for type safety in tests
import { ZodError } from 'zod';

describe('ValidationService', () => {
  let service: ValidationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ValidationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('validateUnit', () => {
    // Test case 1: Valid 'solo' data
    it('should return success for valid solo data', () => {
      const validSoloData = {
        type: 'solo',
        name: 'Test Solo',
        faction: 'mercenaries',
        baseSize: 30,
        fieldAllowance: 1,
        keywords: ['solo', 'test'],
        points: 5,
        statistics: {
          health: 1,
          speed: 6,
          meleeAttack: 6,
          rangedAttack: 0, // Assuming 0 is valid if no ranged weapon
          defense: 14,
          armour: 14,
          controlRange: 0 // Assuming 0 is valid for non-casters
        },
        abilities: [],
        advantages: [],
        weapons: {} // Assuming empty weapons is valid
      };
      const result = service.validateUnit(validSoloData);
      expect(result.success).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    // Test case 2: Invalid 'solo' data (missing name)
    it('should return failure for solo data missing name', () => {
      const invalidSoloData = {
        type: 'solo',
        // name: 'Test Solo', // Name is missing
        faction: 'mercenaries',
        baseSize: 30,
        fieldAllowance: 1,
        keywords: ['solo', 'test'],
        points: 5,
        statistics: { health: 1, speed: 6, meleeAttack: 6, defense: 14, armour: 14 },
        abilities: [],
        advantages: [],
        weapons: {}
      };
      const result = service.validateUnit(invalidSoloData);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      const nameError = result.errors.find((err: { path: string; }) => err.path === 'name');
      expect(nameError).toBeDefined();
      expect(nameError.message).toContain('Required'); // Zod's default message for missing required fields
    });

    // Test case 3: Invalid 'solo' data (incorrect points type)
    it('should return failure for solo data with incorrect points type', () => {
      const invalidSoloData = {
        type: 'solo',
        name: 'Test Solo Points',
        faction: 'mercenaries',
        baseSize: 30,
        fieldAllowance: 1,
        keywords: ['solo', 'test'],
        points: 'five' as any, // Incorrect type
        statistics: { health: 1, speed: 6, meleeAttack: 6, defense: 14, armour: 14 },
        abilities: [],
        advantages: [],
        weapons: {}
      };
      const result = service.validateUnit(invalidSoloData);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      const pointsError = result.errors.find((err: { path: string; }) => err.path === 'points');
      expect(pointsError).toBeDefined();
      expect(pointsError.message).toContain('Expected number, received string');
    });

    // Test case 4: Valid 'warcaster' data
    it('should return success for valid warcaster data', () => {
      const validWarcasterData = {
        type: 'warcaster',
        name: 'Test Warcaster',
        faction: 'cygnar',
        baseSize: 40,
        fieldAllowance: 'c',
        keywords: ['warcaster', 'test'],
        statistics: {
          health: 18,
          speed: 6,
          meleeAttack: 7,
          rangedAttack: 6,
          defense: 15,
          armour: 16,
          arcana: 8,
          arcaneAttack: 7,
          controlRange: 16
        },
        abilities: [],
        advantages: [],
        weapons: {},
        feat: { testFeat: { name: 'Test Feat', rules: 'Does something cool' } },
        rackSlots: 3,
        spells: ['testSpell1']
      };
      const result = service.validateUnit(validWarcasterData);
      expect(result.success).toBe(true);
      expect(result.errors).toBeUndefined();
    });
    
    // Test case 5: Invalid 'warcaster' data (missing feat)
    it('should return failure for warcaster data missing feat', () => {
      const invalidWarcasterData = {
        type: 'warcaster',
        name: 'Test Warcaster No Feat',
        faction: 'cygnar',
        baseSize: 40,
        fieldAllowance: 'c',
        keywords: ['warcaster', 'test'],
        statistics: { health: 18, speed: 6, meleeAttack: 7, defense: 15, armour: 16, arcana: 8, controlRange: 16 },
        abilities: [],
        advantages: [],
        weapons: {},
        // feat is missing
        rackSlots: 3,
        spells: ['testSpell1']
      };
      const result = service.validateUnit(invalidWarcasterData);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      const featError = result.errors.find((err: { path: string; }) => err.path === 'feat');
      expect(featError).toBeDefined();
    });


    // Test case 6: Unknown unit type
    it('should return failure for an unknown unit type', () => {
      const unknownTypeData = {
        type: 'dragon', // Unknown type
        name: 'Test Dragon'
      };
      const result = service.validateUnit(unknownTypeData);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      // The error message comes from the unitSchema function in units.ts
      expect(result.errors.message).toContain('Invalid unit type dragon');
    });

    // Test case 7: Missing unit type
    it('should return failure if unit type is missing', () => {
      const noTypeData = {
        // type is missing
        name: 'Test No Type'
      };
      const result = service.validateUnit(noTypeData);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors.message).toContain("Invalid unit data: 'type' field is missing or not a string.");
    });
  });
});
