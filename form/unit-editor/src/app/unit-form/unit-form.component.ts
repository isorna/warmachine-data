import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UnitDataService } from '../unit-data.service';
import { ValidationService, ValidationResult } from '../validation.service'; // Import ValidationResult
// unitSchema import can be removed if getUnitTypes provides static list and no other direct use
// import { unitSchema } from '../schemas/units';
import { Observable, of } from 'rxjs';
import { first } from 'rxjs/operators';

@Component({
  selector: 'app-unit-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './unit-form.component.html',
  styleUrls: ['./unit-form.component.css']
})
export class UnitFormComponent implements OnInit {
  unitData: any = {}; // Initialize as empty, will be populated in ngOnInit
  unitFileName: string | null = null;
  validationErrors: Array<{ path: string; message: string }> = []; // Typed for ValidationResult

  availableUnitTypes: string[] = [];
  availableFactions$: Observable<string[]> = of([]);
  availableArmies$: Observable<string[]> = of([]);
  availableAdvantages$: Observable<string[]> = of([]);
  // Add _display properties for comma-separated string versions of arrays
  advantages_display: string = '';
  armies_display: string = '';

  isLoading: boolean = true; // To manage loading state

  constructor(
    private unitDataService: UnitDataService,
    private validationService: ValidationService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.availableUnitTypes = this.getUnitTypes();
    // TODO: get faction names also
    this.availableFactions$ = this.unitDataService.getFactionKeys();
    this.availableArmies$ = this.unitDataService.getArmyKeys();
    this.availableAdvantages$ = this.unitDataService.getAdvantageKeys();

    this.route.paramMap.subscribe(params => {
      const fileName = params.get('fileName');
      if (fileName) {
        this.unitFileName = fileName;
        this.unitDataService.getUnitData(this.unitFileName).subscribe(data => {
          if (data && Object.keys(data).length > 0) {
            this.unitData = data;
            // Ensure array fields exist before preparing for display
            this.unitData.advantages = this.unitData.advantages || [];
            this.unitData.armies = this.unitData.armies || [];
            this.unitData.keywords = this.unitData.keywords || []; // Assuming keywords also might be edited this way or is an array
            // Ensure statistics object exists if it can be undefined
            this.unitData.statistics = this.unitData.statistics || {};
          } else {
            console.warn(`No data found for ${this.unitFileName}, or data is empty. Initializing with default structure.`);
            this.initializeNewUnitData(); // Use a helper for new unit structure
          }
          this.prepareUnitDataForDisplay();
          this.isLoading = false;
        });
      } else {
        this.unitFileName = null;
        this.initializeNewUnitData();
        this.prepareUnitDataForDisplay();
        this.isLoading = false;
      }
    });
  }

  private initializeNewUnitData(): void {
    this.unitData = {
      name: '',
      type: this.availableUnitTypes[0] || 'solo', // Default to first type or 'solo'
      faction: '', // Default faction, user should select
      statistics: { health: 1, speed: 6, armour: 12, defense: 12 }, // Basic stats
      keywords: [],
      advantages: [],
      armies: [],
      // Initialize other fields as needed by your schemas to avoid undefined issues
      baseSize: 30,
      fieldAllowance: 1,
      weapons: {},
      abilities: []
    };
    // For Warcaster specific fields if type is 'warcaster'
    if (this.unitData.type === 'warcaster') {
        this.unitData.feat = {};
        this.unitData.rackSlots = 0;
        this.unitData.spells = [];
    }
    // For types with points
    if (['solo', 'unit', 'attachment'].includes(this.unitData.type)) {
        this.unitData.points = 0;
    }
     if (this.unitData.type === 'unit') {
        this.unitData.grunts = 0;
    }
  }

  private arrayToString(arr: string[] | undefined): string {
    return arr ? arr.join(', ') : '';
  }

  private stringToArray(str: string | undefined): string[] {
    return str ? str.split(',').map(s => s.trim()).filter(s => s) : [];
  }

  prepareUnitDataForSave(): void {
    this.unitData.advantages = this.stringToArray(this.unitData.advantages_display);
    this.unitData.armies = this.stringToArray(this.unitData.armies_display);
    // Add for other array fields like keywords if managed this way
    // this.unitData.keywords = this.stringToArray(this.unitData.keywords_display);
  }

  prepareUnitDataForDisplay(): void {
    this.unitData.advantages_display = this.arrayToString(this.unitData.advantages);
    this.unitData.armies_display = this.arrayToString(this.unitData.armies);
    // this.unitData.keywords_display = this.arrayToString(this.unitData.keywords);
  }

  saveUnit(): void {
    this.validationErrors = []; // Clear previous errors
    this.prepareUnitDataForSave();

    this.validationService.validateUnit(this.unitData).pipe(first()).subscribe(validationResult => {
      if (validationResult.success) {
        if (this.unitFileName) {
          this.unitDataService.saveUnitData(this.unitFileName, this.unitData).subscribe({
            next: () => {
              console.log('Unit saved successfully:', this.unitFileName);
              this.router.navigate(['/units']);
            },
            error: (err) => {
                console.error('Error saving unit:', err);
                this.validationErrors = [{path: 'save', message: `Failed to save unit: ${err.message}`}]
            }
          });
        } else {
          // New unit logic (filename derivation, etc.)
          if (!this.unitData.name || this.unitData.name.trim() === '') {
            this.validationErrors = [{ path: 'name', message: 'Unit name is required to create a file.' }];
            this.prepareUnitDataForDisplay(); // Revert arrays to strings for display
            return;
          }
          const derivedFileName = `${this.unitData.name.toLowerCase().replace(/\s+/g, '_')}.json`;
          if (!this.unitData.faction) { // Ensure faction is set
            this.unitData.faction = 'mercenaries'; // Or get first from availableFactions$ if loaded
          }

          this.unitDataService.createUnitFile(derivedFileName, this.unitData).subscribe({
            next: () => {
              console.log('Unit created successfully:', derivedFileName);
              this.router.navigate(['/units']);
            },
            error: (err) => {
                console.error('Error creating unit:', err);
                this.validationErrors = [{path: 'create', message: `Failed to create unit: ${err.message}`}]
                this.prepareUnitDataForDisplay(); // Revert arrays to strings for display
            }
          });
        }
      } else {
        this.validationErrors = validationResult.errors;
        console.error('Validation failed:', this.validationErrors);
        this.prepareUnitDataForDisplay(); // Revert arrays to strings for display
      }
    });
  }

  getUnitTypes(): string[] {
    return ['attachment', 'battleEngine', 'solo', 'structure', 'unit', 'warbeast', 'warcaster', 'warjack', 'warlock'];
  }

  getDefaultStructureForType(type: string): any {
    const base: any = {
        type,
        name: this.unitData.name || '',
        faction: this.unitData.faction || '',
        statistics: this.unitData.statistics || { health: 1, speed: 6, armour: 12, defense: 12 },
        keywords: this.unitData.keywords || [],
        advantages: this.unitData.advantages || [], // Keep existing converted arrays
        armies: this.unitData.armies || [],         // Keep existing converted arrays
        advantages_display: this.unitData.advantages_display || '', // Keep existing display strings
        armies_display: this.unitData.armies_display || '',         // Keep existing display strings
        baseSize: this.unitData.baseSize || 30,
        fieldAllowance: this.unitData.fieldAllowance || 1,
        weapons: this.unitData.weapons || {},
        abilities: this.unitData.abilities || []
    };

    switch(type) {
      case 'warcaster':
        base.feat = this.unitData.feat || {};
        base.rackSlots = this.unitData.rackSlots || 0;
        base.spells = this.unitData.spells || [];
        break;
      case 'solo':
      case 'attachment':
        base.points = this.unitData.points || 0;
        break;
      case 'unit':
        base.grunts = this.unitData.grunts || 0;
        base.points = this.unitData.points || 0;
        break;
      case 'warjack':
        base.damageGrid = this.unitData.damageGrid || [];
        base.options = this.unitData.options || {};
        break;
    }
    return base;
  }

  onTypeChange(newType: string): void {
    // Preserve essential parts and convert arrays for display immediately
    const preservedName = this.unitData.name;
    const preservedFaction = this.unitData.faction;
    // Preserve string display versions during type change
    const preservedAdvantagesDisplay = this.unitData.advantages_display;
    const preservedArmiesDisplay = this.unitData.armies_display;

    this.unitData = this.getDefaultStructureForType(newType); // This sets new defaults

    // Restore preserved common fields
    this.unitData.name = preservedName;
    this.unitData.faction = preservedFaction;

    // Restore display strings, which will be used by prepareUnitDataForSave if not changed
    this.unitData.advantages_display = preservedAdvantagesDisplay;
    this.unitData.armies_display = preservedArmiesDisplay;

    // Convert from potentially preserved display strings back to arrays, then to display strings
    // This ensures the actual data arrays are consistent with display strings after type change
    this.prepareUnitDataForSave(); // Converts _display to actual arrays
    this.prepareUnitDataForDisplay(); // Converts actual arrays back to _display for form

    console.log("Unit data after type change:", this.unitData);
  }

  cancelEdit(): void {
    this.router.navigate(['/units']);
  }
}
