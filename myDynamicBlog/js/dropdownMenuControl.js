/**
 * Class for  handling a Dropdown menu
 * @author Stefan Korecko (2021)
 */
export default class DropdownMenuControl {

    /**
     * Dropdown menu handler constructor with initialisation
     * @param menuItemsElmId - id of a html element with the items of the menu
     * @param menuTitleElmId - id of a html element with the title of the menu
     * @param showCssClass  - name of a class to be assigned to the html element with the items of the menu when displayed
     */
    constructor(menuItemsElmId, menuTitleElmId, showCssClass) {
        this.menuItemsElm = document.getElementById(menuItemsElmId);
        this.menuTitleElm = document.getElementById(menuTitleElmId);
        this.menuSelector = `#${menuItemsElmId},#${menuTitleElmId}`;
        this.showCssClass = showCssClass;

        document.addEventListener("click", event => this.hideMenu(event));
        this.menuTitleElm.addEventListener("click", event => this.displayOrHideMenu(event));
    }

    /**
     * displays or hides the html element with the items of the menu
     */
    displayOrHideMenu(){
            this.menuItemsElm.classList.toggle(this.showCssClass);
    }

    /**
     * hides the html element with the items of the menu
     */
    hideMenu(event) {
        if(!event.target.matches(this.menuSelector)){
            const menuClElmCList=this.menuItemsElm.classList;
            if(menuClElmCList.contains(this.showCssClass)) menuClElmCList.remove(this.showCssClass);
        }
    }

}