import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-faction-form',
  imports: [RouterModule],
  templateUrl: './faction-form.component.html',
  styleUrl: './faction-form.component.css'
})
export class FactionFormComponent {
  faction: string | null = null;
  isLoading: boolean = true; // To manage loading state

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isLoading = true;

    this.route.paramMap.subscribe(params => {
      const faction = params.get('faction');
      if (faction) {
        this.faction = faction;
        // TODO: get faction unit's list
        // this.unitDataService.getUnitData(this.unitFileName).subscribe(data => {
        //   if (data && Object.keys(data).length > 0) {
        //     this.unitData = data;
        //     // Ensure array fields exist before preparing for display
        //     this.unitData.advantages = this.unitData.advantages || [];
        //     this.unitData.armies = this.unitData.armies || [];
        //     this.unitData.keywords = this.unitData.keywords || []; // Assuming keywords also might be edited this way or is an array
        //     // Ensure statistics object exists if it can be undefined
        //     this.unitData.statistics = this.unitData.statistics || {};
        //   } else {
        //     console.warn(`No data found for ${this.unitFileName}, or data is empty. Initializing with default structure.`);
        //     this.initializeNewUnitData(); // Use a helper for new unit structure
        //   }
        //   this.prepareUnitDataForDisplay();
        //   this.isLoading = false;
        // });
        this.isLoading = false;
      } else {
        this.faction = null;
        // this.initializeNewUnitData();
        // this.prepareUnitDataForDisplay();
        this.isLoading = false;
      }
    });
  }
}
