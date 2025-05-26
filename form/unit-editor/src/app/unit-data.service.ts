import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';

// Placeholder data for cryx.json
const cryxPlaceholderData = {
	// "dekathus1": { // Assuming this is one unit within cryx.json, let's make it the actual content for the file
	// 	"abilities": ["entropicForce", "ghostShield", "soulTakerCullSoul"],
	// 	"advantages": ["pathfinder", "tough", "undead", "unstoppable"],
	// 	"armies": ["necrofactorium"],
	// 	"baseSize": 40,
	// 	"faction": "cryx",
	// 	"feat": {"doomsDay": {"name": "Doom's Day", "rules": "..."}},
	// 	"fieldAllowance": "c",
	// 	"keywords": ["cryx", "necrofactorium", "warcaster"],
	// 	"name": "Lich Lord Dekathus",
	// 	"rackSlots": 2,
	// 	"spells": ["annihilation", "impendingDoom", "shadowmancer"],
	// 	"statistics": {"arcana": 7, "arcaneAttack": 6, "armour": 18, "controlRange": 14, "defense": 14, "health": 17, "meleeAttack": 7, "speed": 5},
	// 	"type": "warcaster",
	// 	"weapons": {"mortifier": {"abilities": ["bloodBoon", "gatesOfHell"], "name": "Mortifier", "qualities": ["damageTypeMagical"], "quantity": 2, "statistics": {"power": 12, "range": 1}, "type": "melee"}}
	// }
	// ... other cryx units removed for brevity in this definition
};

const cygnarPlaceholderData = { // Example for another file
    // "stryker1": {
    //     "name": "Commander Coleman Stryker",
    //     "faction": "cygnar",
    //     "type": "warcaster",
    //     // ... other details
    // }
};

@Injectable({
  providedIn: 'root'
})
export class UnitDataService {
  private dataUnitsUrl = 'api/units'; // Placeholder URL

  // Mocked data store
  private mockUnitFiles: string[] = [
    'cryx.json',
    'cygnar.json',
    'dusk.json',
    'khador.json',
    'khymaera.json',
    'orgoth.json',
    'southern-kriels.json'
  ];
  private mockUnitData: { [key: string]: any } = {
    'cryx.json': cryxPlaceholderData, // Store the whole object for cryx.json
    'cygnar.json': cygnarPlaceholderData // Example for cygnar
  };

  constructor(private http: HttpClient) { }

  // listUnitFiles(): Observable<string[]> {
  async listUnitFiles(): Promise<Observable<{ fileName: string; profileCount: number; }[]>> {
    // console.log('UnitDataService: Listing unit files (mocked)');
    // Read data from /data files
    const unitFiles = await Promise.all(
      this.mockUnitFiles.map(async (fileName) => {
        const filePath = `assets/data/units/${fileName}`;
        try {
          const response = await this.http.get(filePath).toPromise();
          const data = JSON.parse(JSON.stringify(response));
          // console.log(`File ${fileName} exists (${Object.keys(data).length} profiles loaded)`);
          this.mockUnitData[fileName] = data;
          return { fileName, profileCount: Object.keys(data).length };
        } catch (error) {
          console.error(`Error checking file ${fileName}:`, error);
          return { fileName, profileCount: 0 };
        }
      })
    );
    return of(unitFiles);
    // Return a list of objects, containing the file names and the profile count
    // return of(this.mockUnitFiles.map(fileName => ({
    //   fileName,
    //   profileCount: Object.keys(this.mockUnitData[fileName]).length
    // })));
    // return of([...this.mockUnitFiles]); // Return a copy
  }

  getUnitData(fileName: string): Observable<any> {
    console.log(`UnitDataService: Getting unit data for ${fileName} (mocked)`);
    const data = this.mockUnitData[fileName];
    return of(data ? JSON.parse(JSON.stringify(data)) : {}); // Return a deep copy or empty object
  }

  saveUnitData(fileName: string, data: any): Observable<void> {
    console.log(`UnitDataService: Saving unit data for ${fileName} (mocked)`, data);
    this.mockUnitData[fileName] = JSON.parse(JSON.stringify(data)); // Update mock data
    if (!this.mockUnitFiles.includes(fileName)) {
      this.mockUnitFiles.unshift(fileName); // Add if it's a new file from save (though createUnitFile is preferred)
    }
    return of(undefined);
  }

  createUnitFile(fileName: string, data: any): Observable<void> {
    console.log(`UnitDataService: Attempting to create file: ${fileName} in data/units/ with data: `, data);
    if (this.mockUnitFiles.includes(fileName)) {
      console.warn(`UnitDataService: File ${fileName} already exists. Overwriting mock data.`);
      // Potentially return an error or specific response here in a real app
      // For mock, we'll allow overwrite
    } else {
      this.mockUnitFiles.unshift(fileName); // Add to beginning of array
    }
    this.mockUnitData[fileName] = JSON.parse(JSON.stringify(data)); // Store deep copy

    console.log('UnitDataService: mockUnitFiles after creation:', this.mockUnitFiles);
    console.log('UnitDataService: mockUnitData after creation:', this.mockUnitData);
    return of(undefined);
  }

  deleteUnitFile(fileName: string): Observable<void> {
    console.log(`UnitDataService: Deleting unit file ${fileName} (mocked)`);
    const index = this.mockUnitFiles.indexOf(fileName);
    if (index > -1) {
      this.mockUnitFiles.splice(index, 1);
    }
    delete this.mockUnitData[fileName];
    console.log('UnitDataService: mockUnitFiles after deletion:', this.mockUnitFiles);
    return of(undefined);
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`, error);
      return of(result as T);
    };
  }

  // New methods to fetch keys from JSON assets
  getArmyKeys(): Observable<string[]> {
    return this.http.get<any>('assets/data/armies.json').pipe(
      map(data => Object.keys(data)),
      catchError(error => {
        console.error('Error fetching army keys:', error);
        return of([]); // Return empty array on error
      })
    );
  }

  getFactionKeys(): Observable<string[]> {
    return this.http.get<any>('assets/data/factions.json').pipe(
      map(data => Object.keys(data)),
      catchError(error => {
        console.error('Error fetching faction keys:', error);
        return of([]);
      })
    );
  }

  getAdvantageKeys(): Observable<string[]> {
    return this.http.get<any>('assets/data/advantages.json').pipe(
      map(data => Object.keys(data)),
      catchError(error => {
        console.error('Error fetching advantage keys:', error);
        return of([]);
      })
    );
  }

  getQualityKeys(): Observable<string[]> {
    return this.http.get<any>('assets/data/qualities.json').pipe(
      map(data => Object.keys(data)),
      catchError(error => {
        console.error('Error fetching quality keys:', error);
        return of([]);
      })
    );
  }

  getRuleKeys(): Observable<string[]> { // For potential use
    return this.http.get<any>('assets/data/rules.json').pipe(
      map(data => Object.keys(data)),
      catchError(error => {
        console.error('Error fetching rule keys:', error);
        return of([]);
      })
    );
  }

  getSpellKeys(): Observable<string[]> { // For potential use
    return this.http.get<any>('assets/data/spells.json').pipe(
      map(data => Object.keys(data)),
      catchError(error => {
        console.error('Error fetching spell keys:', error);
        return of([]);
      })
    );
  }
}
