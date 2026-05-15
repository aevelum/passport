------------------------- MODULE reservation_core -------------------------
EXTENDS Naturals, Sequences, FiniteSets

CONSTANTS Holder, Attester, Verifier, PolicyPublisher, HandoffRecipient, Auditor

VARIABLES credential, presentation, reservation, residual, handoff, auditGrant

Actors ==
  /\ Holder # Attester
  /\ Holder # Verifier
  /\ Holder # PolicyPublisher
  /\ Verifier # PolicyPublisher
  /\ HandoffRecipient # Holder
  /\ HandoffRecipient # Attester
  /\ HandoffRecipient # Verifier

Init ==
  /\ credential = [holder |-> Holder,
                   attester |-> Attester,
                   policyPublisher |-> PolicyPublisher,
                   reservableAmount |-> 50,
                   active |-> TRUE]
  /\ presentation = NULL
  /\ reservation = NULL
  /\ residual = NULL
  /\ handoff = NULL
  /\ auditGrant = NULL

Present ==
  /\ credential # NULL
  /\ credential.active = TRUE
  /\ presentation' = [holder |-> credential.holder,
                      attester |-> credential.attester,
                      verifier |-> Verifier,
                      policyPublisher |-> credential.policyPublisher,
                      presentedReservableAmount |-> credential.reservableAmount]
  /\ UNCHANGED <<credential, reservation, residual, handoff, auditGrant>>

Reserve(amount) ==
  /\ presentation # NULL
  /\ amount > 0
  /\ amount <= presentation.presentedReservableAmount
  /\ credential' = [credential EXCEPT !.active = FALSE]
  /\ reservation' = [holder |-> presentation.holder,
                     attester |-> presentation.attester,
                     verifier |-> presentation.verifier,
                     policyPublisher |-> presentation.policyPublisher,
                     reservedAmount |-> amount,
                     active |-> TRUE,
                     visibleTo |-> {presentation.holder, presentation.attester, presentation.verifier}]
  /\ residual' =
      IF amount < presentation.presentedReservableAmount
      THEN [holder |-> presentation.holder,
            attester |-> presentation.attester,
            policyPublisher |-> presentation.policyPublisher,
            reservableAmount |-> presentation.presentedReservableAmount - amount]
      ELSE NULL
  /\ UNCHANGED <<presentation, handoff, auditGrant>>

Release ==
  /\ reservation # NULL
  /\ reservation.active = TRUE
  /\ credential' = [holder |-> reservation.holder,
                    attester |-> reservation.attester,
                    policyPublisher |-> reservation.policyPublisher,
                    reservableAmount |-> reservation.reservedAmount,
                    active |-> TRUE]
  /\ reservation' = [reservation EXCEPT !.active = FALSE]
  /\ UNCHANGED <<presentation, residual, handoff, auditGrant>>

CreateHandoff ==
  /\ reservation # NULL
  /\ reservation.active = TRUE
  /\ handoff' = [reservationHolder |-> reservation.holder,
                 reservationAttester |-> reservation.attester,
                 reservationVerifier |-> reservation.verifier,
                 handoffRecipient |-> HandoffRecipient,
                 visibleTo |-> {reservation.holder, reservation.attester, reservation.verifier, HandoffRecipient}]
  /\ UNCHANGED <<credential, presentation, reservation, residual, auditGrant>>

GrantAudit(fields) ==
  /\ Len(fields) > 0
  /\ auditGrant' = [holder |-> Holder,
                    attester |-> Attester,
                    auditor |-> Auditor,
                    allowedFields |-> fields,
                    visibleTo |-> {Holder, Attester, Auditor}]
  /\ UNCHANGED <<credential, presentation, reservation, residual, handoff>>

Next ==
  \/ Present
  \/ \E amount \in 1..50: Reserve(amount)
  \/ Release
  \/ CreateHandoff
  \/ \E fields \in SUBSET {"credentialId", "policyId", "evidenceManifestHash"}:
       /\ fields # {}
       /\ GrantAudit(fields)

ReservationBounded ==
  reservation # NULL => reservation.reservedAmount <= presentation.presentedReservableAmount

ResidualSubtractive ==
  /\ reservation # NULL
  /\ residual # NULL
  => residual.reservableAmount = presentation.presentedReservableAmount - reservation.reservedAmount

ReleasePreservesPolicyPublisher ==
  credential # NULL /\ reservation # NULL /\ reservation.active = FALSE
  => credential.policyPublisher = reservation.policyPublisher

HandoffDoesNotWidenReservation ==
  handoff # NULL => ~(HandoffRecipient \in reservation.visibleTo)

AuditGrantScoped ==
  auditGrant # NULL => Auditor \in auditGrant.visibleTo /\ ~(Verifier \in auditGrant.visibleTo)

Spec == Init /\ [][Next]_<<credential, presentation, reservation, residual, handoff, auditGrant>>

=============================================================================
