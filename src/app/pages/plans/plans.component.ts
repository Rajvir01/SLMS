import { Subscription } from 'rxjs';
import { ChangeDetectorRef, Component, OnInit, NgZone } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import {
  collection,
  doc,
  Firestore,
  deleteDoc,
  query,
  onSnapshot,
} from "@angular/fire/firestore";
import { PlanModel } from "../../utils/PlanModel";
import { PLANS_COLLECTION } from "../../utils/constants";
import { FormBuilder, FormGroup } from "@angular/forms";
import { DbService } from "src/app/services/db.service";
import { setDoc } from "@angular/fire/firestore";
import { ToastrService } from "ngx-toastr";

@Component({
  selector: 'app-plans',
  templateUrl: './plans.component.html',
  styleUrls: ['./plans.component.scss']
})
export class PlansComponent implements OnInit {

  closeResult: string;
  plansList: PlanModel[] = [];
  loader: boolean = false;
  plansSub: Subscription;
  plansModel: PlanModel

  plansForm: FormGroup;

  constructor(
    private firestore: Firestore,
    private modalService: NgbModal,
    private fb: FormBuilder,
    private db: DbService,
    private toast: ToastrService,
    private change: ChangeDetectorRef,
    private zone: NgZone,
  ) {
  }

  ngOnInit(): void {
    this.db.getPlansList();
    this.plansSub = this.db.plansSub.subscribe((list) => {
      if (list.length !== 0) {
        this.plansList = [...list];
      }
    })
    console.log(this.plansList)
  }

  addNewPlanModal(modalRef: any, obj: PlanModel = null) {
    this.modalService.open(modalRef, { size: "md", centered: false });
    this.initializeForm(obj);
  }

  openConfirmationModal(content) {
    this.modalService.open(content, { size: "sm", centered: false });
  }

  initializeForm(obj: PlanModel = null) {
    if (obj === null) {
      this.plansForm = this.fb.group({
        planID: [doc(collection(this.db.firestore, PLANS_COLLECTION)).id],
        name: [null],
        maxBooks: [null],
        issuePeriod: [null],
        price: [null]
      });
    } else {
      this.plansForm = this.fb.group({
        planID: [obj.planID],
        name: [obj.name],
        maxBooks: [obj.maxBooks],
        issuePeriod: [obj.issuePeriod],
        price: [obj.price]
      });
    }
  }

  openDeleteModal(modal, tagsModal: PlanModel) {
    this.modalService.open(modal, { size: "sm" });
    this.plansModel = tagsModal;
  }

  async deletePlan() {
    this.loader = true;
    let docRef = doc(collection(this.db.firestore, PLANS_COLLECTION), this.plansModel.planID);
    deleteDoc(docRef)
      .then(() => {
        let idx = this.plansList.findIndex(x => x.planID === this.plansModel.planID);
        this.modalService.dismissAll();
        this.toast.success("Tag Deleted Successfully !");
        this.loader = false
      }, (error) => {
        this.loader = false
        this.toast.warning("Something went wrong ! Please try again.");
      }
      );
  }

  async saveToFirestore() {
    this.loader = true;
    let values: PlanModel = { ...this.plansForm.value };
    let docRef = doc(collection(this.db.firestore, PLANS_COLLECTION), values.planID);
    setDoc(docRef, { ...values }, { merge: true })
      .then(() => {
        this.loader = false;
        this.modalService.dismissAll();
        this.toast.success("Plan Added Successfully", "")
      }, (error) => {
        console.log(error);
        this.loader = false;
        this.toast.warning("Something went wrong! Please try again.", "");
      });
  }

}
