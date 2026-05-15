const STATUS = Object.freeze({
  ACTIVE: 'active',
  REJECTED: 'rejected'
});

function reserve(presentation, reservedAmount) {
  if (!presentation.reservationAllowed) return { status: STATUS.REJECTED, reason: 'reservation-disabled' };
  if (reservedAmount <= 0) return { status: STATUS.REJECTED, reason: 'non-positive' };
  if (reservedAmount > presentation.presentedReservableAmount) return { status: STATUS.REJECTED, reason: 'over-reservation' };

  const reservation = {
    id: `reservation-${reservedAmount}`,
    holder: presentation.holder,
    attester: presentation.attester,
    verifier: presentation.verifier,
    policyPublisher: presentation.policyPublisher,
    reservedAmount,
    active: true,
    visibleTo: new Set([presentation.holder, presentation.attester, presentation.verifier])
  };

  const residualAmount = presentation.presentedReservableAmount - reservedAmount;
  const residualCredential = residualAmount > 0
    ? {
        holder: presentation.holder,
        attester: presentation.attester,
        policyPublisher: presentation.policyPublisher,
        reservableAmount: residualAmount,
        visibleTo: new Set([presentation.holder, presentation.attester])
      }
    : null;

  return { status: STATUS.ACTIVE, reservation, residualCredential };
}

function release(reservation) {
  if (!reservation.active) return { status: STATUS.REJECTED, reason: 'reservation-inactive' };
  reservation.active = false;
  return {
    holder: reservation.holder,
    attester: reservation.attester,
    policyPublisher: reservation.policyPublisher,
    reservableAmount: reservation.reservedAmount,
    visibleTo: new Set([reservation.holder, reservation.attester])
  };
}

function handoff(reservation, handoffRecipient) {
  return {
    reservationId: reservation.id,
    holder: reservation.holder,
    attester: reservation.attester,
    verifier: reservation.verifier,
    handoffRecipient,
    visibleTo: new Set([reservation.holder, reservation.attester, reservation.verifier, handoffRecipient])
  };
}

function auditGrant(holder, attester, auditor, allowedFields) {
  if (!allowedFields.length) return { status: STATUS.REJECTED, reason: 'empty-allowed-fields' };
  return {
    holder,
    attester,
    auditor,
    allowedFields,
    visibleTo: new Set([holder, attester, auditor])
  };
}

function check(condition, id, message, failures, checks) {
  checks.push({ id, pass: Boolean(condition), message });
  if (!condition) failures.push(`${id}: ${message}`);
}

export function runBoundedReservationModel() {
  const actors = Object.freeze({
    holder: 'holder',
    attester: 'attester',
    verifier: 'verifier',
    policyPublisher: 'policyPublisher',
    handoffRecipient: 'handoffRecipient',
    auditor: 'auditor',
    outsider: 'outsider'
  });
  const failures = [];
  const checks = [];

  for (const presentedReservableAmount of [1, 20, 50]) {
    const presentation = {
      holder: actors.holder,
      attester: actors.attester,
      verifier: actors.verifier,
      policyPublisher: actors.policyPublisher,
      presentedReservableAmount,
      reservationAllowed: true
    };

    for (const reservedAmount of [-1, 0, 1, presentedReservableAmount, presentedReservableAmount + 1]) {
      const outcome = reserve(presentation, reservedAmount);
      const shouldReject = reservedAmount <= 0 || reservedAmount > presentedReservableAmount;
      check(
        shouldReject ? outcome.status === STATUS.REJECTED : outcome.status === STATUS.ACTIVE,
        'PO-DAML-001',
        `reservation bound case presented=${presentedReservableAmount} reserved=${reservedAmount}`,
        failures,
        checks
      );

      if (outcome.status !== STATUS.ACTIVE) continue;
      const expectedResidual = presentedReservableAmount - reservedAmount;
      check(
        expectedResidual > 0
          ? outcome.residualCredential?.reservableAmount === expectedResidual
          : outcome.residualCredential === null,
        'PO-DAML-002',
        `residual case presented=${presentedReservableAmount} reserved=${reservedAmount}`,
        failures,
        checks
      );
    }
  }

  const presentation = {
    holder: actors.holder,
    attester: actors.attester,
    verifier: actors.verifier,
    policyPublisher: actors.policyPublisher,
    presentedReservableAmount: 50,
    reservationAllowed: true
  };
  const reserved = reserve(presentation, 20);
  check(reserved.status === STATUS.ACTIVE, 'PO-DAML-001', 'setup reservation is valid', failures, checks);

  const handoffRecord = handoff(reserved.reservation, actors.handoffRecipient);
  check(
    reserved.reservation.active === true
      && handoffRecord.visibleTo.has(actors.handoffRecipient)
      && !reserved.reservation.visibleTo.has(actors.handoffRecipient),
    'PO-DAML-003',
    'handoff does not consume reservation or add reservation visibility',
    failures,
    checks
  );

  const releasedCredential = release(reserved.reservation);
  check(
    actors.policyPublisher !== actors.verifier
      && releasedCredential.policyPublisher === actors.policyPublisher,
    'PO-DAML-004',
    'release preserves policy publisher distinct from verifier',
    failures,
    checks
  );

  const grant = auditGrant(actors.holder, actors.attester, actors.auditor, ['credentialId']);
  const emptyGrant = auditGrant(actors.holder, actors.attester, actors.auditor, []);
  check(
    grant.visibleTo.has(actors.auditor)
      && !grant.visibleTo.has(actors.outsider)
      && emptyGrant.status === STATUS.REJECTED,
    'PO-DAML-005',
    'audit grant visibility is scoped and empty allowed fields are rejected',
    failures,
    checks
  );

  return {
    result_status: failures.length ? 'counterexample' : 'bounded-pass',
    checks,
    failures
  };
}
