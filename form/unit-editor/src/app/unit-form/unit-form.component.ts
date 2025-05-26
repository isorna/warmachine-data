import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // For *ngIf, *ngFor, etc.
import { FormsModule } from '@angular/forms'; // For ngModel
import { ActivatedRoute, Router, RouterModule } from '@angular/router'; // Import RouterModule for routerLink if needed
import { UnitDataService } from '../unit-data.service';
import { ValidationService } from '../validation.service';
import { unitSchema } from '../schemas/units'; // To get unit types, though this might be better handled by a constant

@Component({
  selector: 'app-unit-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule], // Add FormsModule
  templateUrl: './unit-form.component.html',
  styleUrls: ['./unit-form.component.css']
})
export class UnitFormComponent implements OnInit {
  unitData: any = { type: 'solo', name: '', statistics: {}, keywords: [] }; // Basic initialization
  unitFileName: string | null = null;
  validationErrors: any = null;
  availableUnitTypes: string[] = [];

  constructor(
    private unitDataService: UnitDataService,
    private validationService: ValidationService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.availableUnitTypes = this.getUnitTypes();
    this.route.paramMap.subscribe(params => {
      const fileName = params.get('fileName');
      if (fileName) {
        this.unitFileName = fileName;
        this.unitDataService.getUnitData(this.unitFileName).subscribe(data => {
          if (data && Object.keys(data).length > 0) { // Check if data is not empty
            this.unitData = data;
          } else {
            console.warn(`No data found for ${this.unitFileName}, or data is empty. Initializing with default structure.`);
            // Initialize with a default structure if file is empty or not found,
            // keeping the type if it was part of the route or a default.
            this.unitData = { type: this.unitData.type || 'solo', name: '', statistics: {}, keywords: [] };
          }
        });
      } else {
        // Creating a new unit
        this.unitFileName = null;
        // Initialize with a sensible default, ensuring 'type' and 'faction' are set
        this.unitData = { type: 'solo', name: '', faction: 'mercenaries', statistics: { health: 1, speed: 5, armour: 10, defense: 10 }, keywords: [] };
      }
    });
  }

  saveUnit(): void {
    this.validationErrors = null; // Reset errors
    const validationResult = this.validationService.validateUnit(this.unitData);

    if (validationResult.success) {
      if (this.unitFileName) {
        // Existing unit
        this.unitDataService.saveUnitData(this.unitFileName, this.unitData).subscribe({
          next: () => {
            console.log('Unit saved successfully:', this.unitFileName);
            this.router.navigate(['/units']);
          },
          error: (err) => console.error('Error saving unit:', err)
        });
      } else {
        // New unit
        if (!this.unitData.name || this.unitData.name.trim() === '') {
          this.validationErrors = [{ path: 'name', message: 'Unit name is required to create a file.' }];
          console.error('Validation failed:', this.validationErrors);
          return; // Stop if name is missing
        }

        // Derive filename from unit name
        const derivedFileName = `${this.unitData.name.toLowerCase().replace(/\s+/g, '_')}.json`;

        // Ensure faction is set, default if not
        if (!this.unitData.faction) {
          this.unitData.faction = 'mercenaries'; // Default faction
          console.log('Defaulting faction to "mercenaries" for new unit.');
        }
        
        console.log(`Attempting to create unit with derived filename: ${derivedFileName}`, this.unitData);

        this.unitDataService.createUnitFile(derivedFileName, this.unitData).subscribe({
          next: () => {
            console.log('Unit created successfully:', derivedFileName);
            this.router.navigate(['/units']);
          },
          error: (err) => {
            console.error('Error creating unit:', err);
            // Potentially set validationErrors or a general error message here
            this.validationErrors = [{ path: 'file', message: `Error creating file: ${err.message || 'Unknown error'}` }];
          }
        });
      }
    } else {
      this.validationErrors = validationResult.errors;
      console.error('Validation failed:', this.validationErrors);
      // Display errors to the user in the template
    }
  }

  getUnitTypes(): string[] {
    // This is a placeholder. In a real scenario, you might get this from a configuration
    // or by inspecting the keys of an object that maps types to schemas if unitSchema
    // itself is not directly iterable for types.
    // For now, based on the problem description's common types:
    return ['attachment', 'battleEngine', 'solo', 'structure', 'unit', 'warbeast', 'warcaster', 'warjack', 'warlock'];
    // A more dynamic way if unitSchema was a map or if you had an enum:
    // return Object.keys(unitSchema({type: ''}).shape.type.optionsMap); // This is hypothetical
  }

  // Helper to get a default structure based on type, useful for dynamic forms later
  getDefaultStructureForType(type: string): any {
    const base = { type, name: this.unitData.name || '', statistics: {}, keywords: [] };
    switch(type) {
      case 'warcaster':
        return { ...base, feat: {}, rackSlots: 0, spells: [], weapons: {} };
      case 'solo':
        return { ...base, points: 0, weapons: {} };
      case 'unit':
        return { ...base, grunts: 0, points: 0, weapons: {} };
      case 'warjack':
        return { ...base, damageGrid: [], options: {} };
      case 'attachment':
        return { ...base, points: 0, weapons: {} };
      default:
        return base;
    }
  }

  onTypeChange(newType: string): void {
    // When type changes, reset parts of unitData to a default for that type,
    // preserving common fields like 'name' and 'faction'.
    const currentName = this.unitData.name;
    const currentFaction = this.unitData.faction || 'mercenaries'; // Ensure faction has a default
    this.unitData = this.getDefaultStructureForType(newType);
    this.unitData.name = currentName; 
    this.unitData.faction = currentFaction;
    console.log("Unit data after type change:", this.unitData);
  }

  cancelEdit(): void {
    this.router.navigate(['/units']);
  }
}
