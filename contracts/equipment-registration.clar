;; Equipment Registration Contract
;; Records industrial machinery and assigns unique tokens

(define-non-fungible-token equipment uint)

;; Data structure for equipment
(define-map equipment-data
  { equipment-id: uint }
  {
    name: (string-ascii 64),
    manufacturer: (string-ascii 64),
    model: (string-ascii 64),
    year: uint,
    owner: principal,
    status: (string-ascii 20)
  }
)

;; Counter for equipment IDs
(define-data-var equipment-counter uint u1)

;; Register new equipment
(define-public (register-equipment
                (name (string-ascii 64))
                (manufacturer (string-ascii 64))
                (model (string-ascii 64))
                (year uint))
  (let ((equipment-id (var-get equipment-counter))
        (owner tx-sender))
    (try! (nft-mint? equipment equipment-id owner))
    (map-set equipment-data
      { equipment-id: equipment-id }
      {
        name: name,
        manufacturer: manufacturer,
        model: model,
        year: year,
        owner: owner,
        status: "active"
      }
    )
    (var-set equipment-counter (+ equipment-id u1))
    (ok equipment-id)
  )
)

;; Get equipment details
(define-read-only (get-equipment (equipment-id uint))
  (map-get? equipment-data { equipment-id: equipment-id })
)

;; Update equipment status
(define-public (update-equipment-status (equipment-id uint) (status (string-ascii 20)))
  (let ((owner (unwrap! (nft-get-owner? equipment equipment-id) (err u403))))
    (asserts! (is-eq tx-sender owner) (err u403))
    (map-set equipment-data
      { equipment-id: equipment-id }
      (merge (unwrap! (get-equipment equipment-id) (err u404))
             { status: status })
    )
    (ok true)
  )
)

;; Transfer equipment ownership
(define-public (transfer-equipment (equipment-id uint) (recipient principal))
  (let ((owner (unwrap! (nft-get-owner? equipment equipment-id) (err u403))))
    (asserts! (is-eq tx-sender owner) (err u403))
    (try! (nft-transfer? equipment equipment-id tx-sender recipient))
    (map-set equipment-data
      { equipment-id: equipment-id }
      (merge (unwrap! (get-equipment equipment-id) (err u404))
             { owner: recipient })
    )
    (ok true)
  )
)
