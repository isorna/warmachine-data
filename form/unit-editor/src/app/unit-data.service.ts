import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UnitDataService {
  private dataUnitsUrl = 'api/units'; // Placeholder URL

  // Data store
  private factionUnitFiles: string[] = [
    'cryx.json',
    'cygnar.json',
    'dusk.json',
    'khador.json',
    'khymaera.json',
    'orgoth.json',
    'southern-kriels.json'
  ];
  private factionUnitData: { [key: string]: any } = {};

  constructor(private http: HttpClient) { }

  async listUnitFiles(): Promise<Observable<{ fileName: string; profileCount: number; }[]>> {
    // Read data from /data files
    const unitFiles = await Promise.all(
      this.factionUnitFiles.map(async (fileName) => {
        const filePath = `assets/data/units/${fileName}`;
        try {
          const response = await firstValueFrom(this.http.get(filePath));
          const data = JSON.parse(JSON.stringify(response));
          console.log(`File ${fileName} exists (${Object.keys(data).length} profiles loaded)`);
          this.factionUnitData[fileName] = data;
          return { fileName, profileCount: Object.keys(data).length };
        } catch (error) {
          console.error(`Error checking file ${fileName}:`, error);
          return { fileName, profileCount: 0 };
        }
      })
    );
    // Return a list of objects, containing the file names and the profile count
    return of(unitFiles);
  }

  async getFactionData(fileName: string): Promise<Observable<any | {}>> {
    console.log(`UnitDataService: Getting faction data for ${fileName}`);
    // Read data from /data/units/${fileName}
    const filePath = `assets/data/units/${fileName}`;
    try {
      const response = await firstValueFrom(this.http.get(filePath));
      const data = JSON.parse(JSON.stringify(response));
      console.log(`File ${fileName} exists (${Object.keys(data).length} profiles loaded)`);
      this.factionUnitData[fileName] = data;
      return of(data ? JSON.parse(JSON.stringify(data)) : {});
    } catch (error) {
      console.error(`Error checking file ${fileName}:`, error);
      return of({});
    }
    // const data = this.factionUnitData[fileName];
    // return of(data ? JSON.parse(JSON.stringify(data)) : {}); // Return a deep copy or empty object
  }

  getUnitData(fileName: string): Observable<any> {
    console.log(`UnitDataService: Getting unit data for ${fileName} (mocked)`);
    const data = this.factionUnitData[fileName];
    return of(data ? JSON.parse(JSON.stringify(data)) : {}); // Return a deep copy or empty object
  }

  saveUnitData(fileName: string, data: any): Observable<void> {
    console.log(`UnitDataService: Saving unit data for ${fileName} (mocked)`, data);
    this.factionUnitData[fileName] = JSON.parse(JSON.stringify(data)); // Update mock data
    if (!this.factionUnitFiles.includes(fileName)) {
      this.factionUnitFiles.unshift(fileName); // Add if it's a new file from save (though createUnitFile is preferred)
    }
    return of(undefined);
  }

  createUnitFile(fileName: string, data: any): Observable<void> {
    console.log(`UnitDataService: Attempting to create file: ${fileName} in data/units/ with data: `, data);
    if (this.factionUnitFiles.includes(fileName)) {
      console.warn(`UnitDataService: File ${fileName} already exists. Overwriting mock data.`);
      // Potentially return an error or specific response here in a real app
      // For mock, we'll allow overwrite
    } else {
      this.factionUnitFiles.unshift(fileName); // Add to beginning of array
    }
    this.factionUnitData[fileName] = JSON.parse(JSON.stringify(data)); // Store deep copy

    console.log('UnitDataService: factionUnitFiles after creation:', this.factionUnitFiles);
    console.log('UnitDataService: factionUnitData after creation:', this.factionUnitData);
    return of(undefined);
  }

  deleteUnitFile(fileName: string): Observable<void> {
    console.log(`UnitDataService: Deleting unit file ${fileName} (mocked)`);
    const index = this.factionUnitFiles.indexOf(fileName);
    if (index > -1) {
      this.factionUnitFiles.splice(index, 1);
    }
    delete this.factionUnitData[fileName];
    console.log('UnitDataService: factionUnitFiles after deletion:', this.factionUnitFiles);
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
