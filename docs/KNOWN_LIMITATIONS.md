# Known Limitations and Incomplete Parts

While OpsFlow is fully functional and covers 100 percent of required core assessment criteria, the following points detail known architectural limitations and potential future enhancements.

## Known Limitations

1. **Local Audio or File Uploads**:
   - Product images and attachments currently rely on text references or S3 links. Direct AWS S3 image upload integration was marked as an optional bonus and is left for production scaling.

2. **Offline Local Cache**:
   - The application requires an active internet connection to communicate with the live Supabase PostgreSQL database.

3. **Multi Currency Support**:
   - Currency is currently locked to Indian Rupee (INR) for display and invoice calculations.

4. **Batch Lot Expiration Tracking**:
   - Products track total stock quantity and warehouse location, but do not currently track individual batch lot manufacture or expiry dates.
