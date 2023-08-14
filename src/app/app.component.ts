import { Component, ElementRef, ViewChild } from '@angular/core';
import { GetDataService } from './services/get-data.service';
import { MatDialog, MatDialogModule} from '@angular/material/dialog';
import { InventoryComponent } from './components/inventory/inventory.component';
import html2canvas from 'html2canvas';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as dbImport  from './../assets/db.json';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'remnant2build';
  db : any = {}
  build : any = {}

  constructor(private getData : GetDataService, public dialog: MatDialog, 
    public snackbar : MatSnackBar){}
  

  ngOnInit() {
    this.db = dbImport;
    if(this.db){
      
      this.build = {
        rings: [this.db.rings[0], this.db.rings[1], this.db.rings[2], this.db.rings[3]],
        meleWeapon: this.db.meleeWeapon[0],
        longGun: this.db.longGun[0],
        handGun: this.db.handGun[0],
        amulet: this.db.amulet[0],
        relic: this.db.relic[0],
        headArmor: this.db.headArmor[0],
        glove: this.db.glove[0],
        bodyArmor: this.db.bodyArmor[0],
        legArmor: this.db.legArmor[0]
      }
    }
    
  }

 

  openDialog(data: string, selected: any) {
    const dialogRef = this.dialog.open(InventoryComponent, {
      width: '80%',
      height:'80%',
      autoFocus: false,
      data: { items: this.db[data], build: this.build, selected},
    });
  
    dialogRef.afterClosed().subscribe(value => {
      if (value) {
        for (const key in this.build) {
          if (Array.isArray(this.build[key])) {
            this.build[key] = this.build[key].map(k => (k.img === selected.img) ? value : k);
          } else if (this.build[key].img === selected.img) {
            this.build[key] = value;
            break;
          }
        }
      }
    });
  }

  async captureAndCopy() {
    const captureDiv = document.querySelector('.flex-container') as HTMLDivElement;
    
    try {
      const canvas = await html2canvas(captureDiv);

      const imageBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));

      if (imageBlob) {
        const clipboardItems: ClipboardItem[] = [
          new ClipboardItem({ [imageBlob.type]: imageBlob })
        ];

        await navigator.clipboard.write(clipboardItems);

        let snackBarRef = this.snackbar.open('Image captured and copied to clipboard.', 'Ok', { duration: 3000 });

      } else {
        console.error('Erro ao criar Blob da imagem.');
      }
    } catch (error) {
      console.error('Erro ao capturar e copiar a imagem:', error);
    }
  }

  async captureAndDownload() {
    const captureDiv = document.querySelector('.flex-container') as HTMLDivElement;
  
    try {
      const canvas = await html2canvas(captureDiv);
  
      const dataUrl = canvas.toDataURL('image/png');
  
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `build_${new Date().getTime()}.png`;
      link.click();
    } catch (error) {
      console.error('Erro ao capturar e fazer o download da imagem:', error);
    }
  }

  
  
}
