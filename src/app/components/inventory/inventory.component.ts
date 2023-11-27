import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-inventory',
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss']
})
export class InventoryComponent {
  
  items : any = []
  allItems : any = []
  build: any = {};
  selected: any = {};
  wordKey : string =  '';
  isLoading : boolean = false;

  constructor(
    public dialogRef: MatDialogRef<InventoryComponent>, 
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.allItems = data.items.sort((a, b) => a.name.localeCompare(b.name));;
    this.build = data.build;
    this.selected = data.selected;
    this.itemsFiltered();
  }

  selectItem(item){
    this.dialogRef.close(item);
  }

  async itemsFiltered(){
    this.isLoading = true;
    
    if(this.wordKey){
      this.items = this.allItems.filter(i => i.name.toLowerCase().includes(this.wordKey.toLowerCase()) || i.description.toLowerCase().includes(this.wordKey.toLowerCase()))
    }
    else{
      this.items = this.allItems;
    }

    await new Promise(resolve => setTimeout(resolve, 200));

    this.isLoading = false;
  }

  checkValueExistsInBuild(value: any): boolean {
    if (Array.isArray(this.build.rings) && this.build.rings.some(item => item.img === value.img)) {
      return true;
    }
  
    const propertiesToCheck = Object.keys(this.build);
  
    if (propertiesToCheck.some(prop => this.build[prop]?.img === value?.img)) {
      return true;
    }
  
    return false;
  }
}
