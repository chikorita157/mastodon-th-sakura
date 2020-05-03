# frozen_string_literal: true

require_relative '../../config/boot'
require_relative '../../config/environment'
require_relative 'cli_helper'

module Mastodon
  class UpgradeCLI < Thor
    include CLIHelper

    def self.exit_on_failure?
      true
    end

    CURRENT_STORAGE_SCHEMA_VERSION = 1

    option :dry_run, type: :boolean, default: false
    option :verbose, type: :boolean, default: false, aliases: [:v]
    desc 'storage-schema', 'Upgrade storage schema of various file attachments to the latest version'
    long_desc <<~LONG_DESC
      Iterates over every file attachment of every record and, if its storage schema is outdated, performs the
      necessary upgrade to the latest one. In practice this means e.g. moving files to different directories.

      Will most likely take a long time.
    LONG_DESC
    def storage_schema
      progress = create_progress_bar(nil)
      dry_run  = dry_run? ? ' (DRY RUN)' : ''
      records  = 0

      klasses = [
        Account,
        CustomEmoji,
        MediaAttachment,
        PreviewCard,
      ]

      klasses.each do |klass|
        attachment_names = klass.attachment_definitions.keys

        klass.find_each do |record|
          attachment_names.each do |attachment_name|
            attachment = record.public_send(attachment_name)

            next if attachment.blank? || attachment.storage_schema_version >= CURRENT_STORAGE_SCHEMA_VERSION

            attachment.styles.each_key do |style|
              case Paperclip::Attachment.default_options[:storage]
              when :s3
                upgrade_storage_s3(progress, attachment, style)
              when :fog
                upgrade_storage_fog(progress, attachment, style)
              when :filesystem
                upgrade_storage_filesystem(progress, attachment, style)
              end

              progress.increment
            end

            attachment.instance_write(:storage_schema_version, CURRENT_STORAGE_SCHEMA_VERSION)
          end

          if record.changed?
            record.save unless dry_run?
            records += 1
          end
        end
      end

      progress.total = progress.progress
      progress.finish

      say("Upgraded storage schema of #{records} records#{dry_run}", :green, true)
    end

    private

    def upgrade_storage_s3(progress, attachment, style)
      previous_storage_schema_version = attachment.storage_schema_version
      object                          = attachment.s3_object(style)

      attachment.instance_write(:storage_schema_version, CURRENT_STORAGE_SCHEMA_VERSION)

      upgraded_path = attachment.path(style)

      if upgraded_path != object.key && object.exists?
        progress.log("Moving #{object.key} to #{upgraded_path}") if options[:verbose]

        begin
          object.move_to(upgraded_path) unless dry_run?
        rescue => e
          progress.log(pastel.red("Error processing #{object.key}: #{e}"))
        end
      end

      # Because we move files style-by-style, it's important to restore
      # previous version at the end. The upgrade will be recorded after
      # all styles are updated
      attachment.instance_write(:storage_schema_version, previous_storage_schema_version)
    end

    def upgrade_storage_fog(_progress, _attachment, _style)
      say('The fog storage driver is not supported for this operation at this time', :red)
      exit(1)
    end

    def upgrade_storage_filesystem(progress, attachment, style)
      previous_storage_schema_version = attachment.storage_schema_version
      previous_path                   = attachment.path(style)

      attachment.instance_write(:storage_schema_version, CURRENT_STORAGE_SCHEMA_VERSION)

      upgraded_path = attachment.path(style)

      if upgraded_path != previous_path && File.exist?(previous_path)
        progress.log("Moving #{previous_path} to #{upgraded_path}") if options[:verbose]

        begin
          unless dry_run?
            FileUtils.mkdir_p(File.dirname(upgraded_path))
            FileUtils.mv(previous_path, upgraded_path)

            begin
              FileUtils.rmdir(previous_path, parents: true)
            rescue Errno::ENOTEMPTY
              # OK
            end
          end
        rescue => e
          progress.log(pastel.red("Error processing #{previous_path}: #{e}"))

          unless dry_run?
            begin
              FileUtils.rmdir(upgraded_path, parents: true)
            rescue Errno::ENOTEMPTY
              # OK
            end
          end
        end
      end

      # Because we move files style-by-style, it's important to restore
      # previous version at the end. The upgrade will be recorded after
      # all styles are updated
      attachment.instance_write(:storage_schema_version, previous_storage_schema_version)
    end
  end
end
