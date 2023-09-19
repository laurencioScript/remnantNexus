import { Component, ElementRef, ViewChild } from '@angular/core';
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

  constructor(public dialog: MatDialog, 
    public snackbar : MatSnackBar){}
  

  ngOnInit() {
    this.db = dbImport;
    if(this.db){
      
      this.build = {
        classes: [this.db.classes[0], this.db.classes[1]],
        skills: [this.db.skills[0], this.db.skills[1]],
        rings: [this.db.rings[0], this.db.rings[1], this.db.rings[2], this.db.rings[3]],
        meleWeapon: this.db.meleeWeapon[0],
        modMeleeWeapon: null,
        mutatorMeleeWeapon: null,
        longGun: this.db.longGun[0],
        modLongGun: null,
        mutatorLongGun: null,
        handGun: this.db.handGun.find(h => h.name == 'Silverback Model 500'),
        modHandGun: null,
        mutatorHandGun: null,
        amulet: this.db.amulet[0],
        relic: this.db.relic[0],
        relicFrags: [this.db.relicFragments[0],this.db.relicFragments[1],this.db.relicFragments[2]],
        headArmor: this.db.headArmor[0],
        glove: this.db.glove[0],
        bodyArmor: this.db.bodyArmor[0],
        legArmor: this.db.legArmor[0]
      }

      this.attachmentSkill(this.db.classes[0]);
      this.attachmentSkill(this.db.classes[1]);
    }
    
  }

 filterSpecificItems({items, type, selected}){
  
  if(type == "modLongGun" || type == "modHandGun"){
    return items.weaponMods.filter(i => !i.exclusive)
  }

  if(type == "mutatorLongGun" || type == "mutatorHandGun"){
    return items.mutators.filter(i => i.type == "Ranged")
  }

  if(type == "mutatorMeleeWeapon"){
    return items.mutators.filter(i => i.type == "Melee")
  }

  if(type == "skills"){
    const skill = items.skills.find(s => s.img == selected.img)
    return items.skills.filter(i => i.type == skill.type)
  }

  return items[type]
 }

  openDialog(data: string, selected: any, event ?: Event) {
   
    if(event){
      event.stopPropagation()
    }
    console.log('>>> openDialog', {data, selected});
    const items = this.filterSpecificItems({items: this.db, type: data, selected});

    const dialogRef = this.dialog.open(InventoryComponent, {
      width: '80%',
      height:'80%',
      autoFocus: false,
      data: { items , build: this.build, selected},
    });
  
    dialogRef.afterClosed().subscribe(value => {
      console.log('>>> value', value);
      console.log('>>> data', data);
      if (value) {
        let updated = false;

        
        if(this.build.hasOwnProperty(data)){
          this.build[data] = value;
        }
        else{
          for (const key in this.build) {
            console.log('>>> key', key);
            if (Array.isArray(this.build[key])) {
              this.build[key] = this.build[key].map(k => {
                if(k.img === selected?.img) {
                  updated = true;
                  return value
                }
                else {
                  return k;
                }
              });
            } else if (this.build[key]?.img === selected?.img) {
              this.build[key] = value;
              updated  = true;
            }
          }
        }

        this.attachmentMod(data)
        this.attachmentSkill(value)
      }

      
    });
  }

  attachmentSkill(value: any){
    const i = this.build.classes.findIndex(c => c.img == value.img)
    this.build.skills[i] = this.db.skills.find(s => s.type == value.name)
  }

  attachmentMod(data: string) {
    console.log('>>> data', data);
    let weaponType, modType;
  
    if (data === 'longGun') {
      weaponType = this.build.longGun;
      modType = 'modLongGun';
    } else if (data === 'handGun') {
      weaponType = this.build.handGun;
      modType = 'modHandGun';
    } else if (data === 'meleeWeapon') {
      weaponType = this.build.meleWeapon;
      modType = 'modMeleeWeapon';
    }
  
    if (weaponType && weaponType.modExclusive) {
      this.build[modType] = this.db.weaponMods.find(w => w.name === weaponType.modExclusive);
    } else {
      this.build[modType] = null;
    }
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
